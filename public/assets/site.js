/* Small progressive enhancements; page content and contact links work without JS. */
(() => {
  'use strict';
  const menuButton = document.querySelector('.menu-toggle');
  const menu = document.querySelector('.main-nav');
  function closeMenu() {
    menu?.classList.remove('is-open');
    menuButton?.setAttribute('aria-expanded', 'false');
    menuButton?.setAttribute('aria-label', 'Open navigation');
    document.body.classList.remove('menu-open');
  }
  menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    menu.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu?.classList.contains('is-open')) {
      closeMenu(); menuButton.focus();
    }
  });
  document.addEventListener('click', event => {
    if (menu?.classList.contains('is-open') && !event.target.closest('.site-header')) closeMenu();
  });
  window.matchMedia('(min-width: 851px)').addEventListener('change', closeMenu);
  window.addEventListener('pageshow', closeMenu);
  menu?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('js-motion');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    }), { threshold: 0.06 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }

  const recommendations = {
    chip: ['A small chip may be repairable.', 'The size, depth and position of the damage matter. Arrange an assessment to find out whether a repair is suitable for your windshield.', 'windshield-repair.html', 'Explore chip repair'],
    crack: ['A crack needs a closer look.', 'Longer cracks, damage near an edge or damage affecting your view may require replacement. Contact the shop with your vehicle details.', 'windshield-replacement.html', 'Explore replacement'],
    other: ['Let’s identify the glass you need.', 'For a broken side or rear window, share the year, make, model and which window is damaged so the shop can confirm availability.', 'side-rear-glass.html', 'Explore side & rear glass'],
    unsure: ['Start with a conversation.', 'You don’t need to diagnose the damage yourself. Call the shop or send a quote request. The shop can ask for photos if needed.', 'contact.html#quote', 'Get help with your glass']
  };
  document.querySelectorAll('[data-damage]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-damage]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    const result = recommendations[button.dataset.damage];
    document.querySelector('#diagnosis-title').textContent = result[0];
    document.querySelector('#diagnosis-copy').textContent = result[1];
    const link = document.querySelector('#diagnosis-link');
    link.href = result[2]; link.querySelector('span').textContent = result[3];
  }));

  const form = document.querySelector('#quote-form');
  if (form) {
    const submitButton = document.querySelector('#prepare-quote');
    const formStatus = document.querySelector('#form-status');
    const fallback = document.querySelector('#quote-output');
    const success = document.querySelector('#quote-success');
    submitButton.disabled = false;
    const params = new URLSearchParams(location.search);
    const service = params.get('service');
    if ([...form.elements.service.options].some(option => option.value === service)) form.elements.service.value = service;

    const vinInput = document.querySelector('#vin');
    vinInput.addEventListener('input', () => {
      vinInput.value = vinInput.value.toUpperCase();
    });

    // Keep selected File objects so customers can add/remove images across selections.
    const photoInput = document.querySelector('#damage-photos');
    const photoList = document.querySelector('#photo-list');
    const photoStatus = document.querySelector('#photo-status');
    const MAX_PHOTOS = 3;
    const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
    const MAX_SEND_BYTES = 850000; // each JPEG; three photos stay under Vercel's conservative 4.5 MB cap
    let selectedPhotos = [];
    let previewUrls = [];

    function photoMessage(message, isError = false) {
      photoStatus.textContent = message;
      photoStatus.classList.toggle('is-error', isError);
    }
    function renderSelectedPhotos() {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      previewUrls = [];
      photoList.replaceChildren();
      selectedPhotos.forEach((file, index) => {
        const li = document.createElement('li');
        li.className = 'photo-preview-item';
        const thumbnail = document.createElement('img');
        const url = URL.createObjectURL(file);
        previewUrls.push(url);
        thumbnail.src = url;
        thumbnail.alt = 'Selected image ' + (index + 1);
        const info = document.createElement('div');
        info.className = 'photo-preview-details';
        const name = document.createElement('strong');
        name.textContent = file.name;
        const size = document.createElement('small');
        size.textContent = (file.size / 1024 / 1024).toFixed(1) + ' MB original';
        info.append(name, size);
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'photo-remove';
        remove.textContent = 'Remove';
        remove.setAttribute('aria-label', 'Remove ' + file.name);
        remove.addEventListener('click', () => {
          if (submitButton.disabled) return;
          selectedPhotos.splice(index, 1);
          renderSelectedPhotos();
          photoMessage(selectedPhotos.length ? selectedPhotos.length + ' photo(s) selected.' : '');
        });
        li.append(thumbnail, info, remove);
        photoList.append(li);
      });
    }
    photoInput.addEventListener('change', () => {
      let notice = '';
      let hasError = false;
      for (const file of Array.from(photoInput.files || [])) {
        if (selectedPhotos.length >= MAX_PHOTOS) {
          notice = 'You can attach up to 3 photos. Remove a photo to add another.';
          hasError = true;
          break;
        }
        if (!file.type.startsWith('image/')) {
          notice = 'Please choose images rather than other file types.';
          hasError = true;
          continue;
        }
        if (file.size > MAX_SOURCE_BYTES) {
          notice = 'Each original photo must be under 20 MB.';
          hasError = true;
          continue;
        }
        if (!selectedPhotos.some(other => other.name === file.name && other.size === file.size && other.lastModified === file.lastModified)) {
          selectedPhotos.push(file);
        }
      }
      photoInput.value = ''; // enables selecting another photo (or the same one) later
      renderSelectedPhotos();
      photoMessage(notice || (selectedPhotos.length ? selectedPhotos.length + ' photo(s) selected.' : ''), hasError);
    });

    async function openImage(file) {
      if ('createImageBitmap' in window) {
        try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (_) { /* fallback for browsers without HEIC support */ }
      }
      return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Photo format not supported. Please use JPG or PNG.')); };
        img.src = url;
      });
    }
    const canvasToJpeg = (canvas, quality) => new Promise((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not process photo.')), 'image/jpeg', quality);
    });
    const jpegToBase64 = blob => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1]);
      reader.onerror = () => reject(new Error('Could not read photo.'));
      reader.readAsDataURL(blob);
    });
    async function preparePhoto(file, index) {
      const img = await openImage(file);
      try {
        const originalWidth = img.width || img.naturalWidth;
        const originalHeight = img.height || img.naturalHeight;
        if (!originalWidth || !originalHeight) throw new Error('Cannot read this photo. Please use JPG or PNG.');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Your browser cannot prepare this photo.');
        let maxSide = 1600;
        let blob;
        for (let attempt = 0; attempt < 10; attempt++) {
          const scale = Math.min(1, maxSide / Math.max(originalWidth, originalHeight));
          canvas.width = Math.max(1, Math.round(originalWidth * scale));
          canvas.height = Math.max(1, Math.round(originalHeight * scale));
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          blob = await canvasToJpeg(canvas, attempt < 3 ? Math.max(.58, .80 - attempt * .10) : .65);
          if (blob.size <= MAX_SEND_BYTES) break;
          maxSide = Math.round(maxSide * .76);
        }
        if (!blob || blob.size > MAX_SEND_BYTES) throw new Error('Photo is too large after resizing. Try another photo.');
        return { filename: 'damage-photo-' + (index + 1) + '.jpg', content: await jpegToBase64(blob) };
      } finally {
        if (typeof img.close === 'function') img.close();
      }
    }

    function showFallback(message, subject) {
      success.hidden = true;
      fallback.hidden = false;
      document.querySelector('#email-preview').textContent = message;
      document.querySelector('#open-email').href = 'mailto:Windshielddoctorautoglass@gmail.com?cc=' + encodeURIComponent('info.Windshielddoctorautoglass@gmail.com') + '&subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(message);
      document.querySelector('#copy-status').textContent = '';
      fallback.focus({ preventScroll: true });
      fallback.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
    }

    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (!form.reportValidity() || submitButton.disabled) return;
      const data = new FormData(form);
      const value = name => String(data.get(name) || '').trim();
      const payload = {
        name: value('name'), phone: value('phone'), email: value('email'),
        service: value('service'), vehicle: value('vehicle'), vin: value('vin').toUpperCase(),
        details: value('details'), website: value('website')
      };
      const message = [
        'Hello Windshield Doctor Auto Glass,', '',
        'I would like a quote for auto glass service.', '',
        'Name: ' + payload.name, 'Phone: ' + payload.phone, 'Email: ' + payload.email,
        'Service: ' + payload.service, 'Vehicle: ' + payload.vehicle,
        'VIN: ' + (payload.vin || 'Not provided'),
        'Damage / additional details: ' + (payload.details || 'To be discussed.'), '',
        'Please let me know the next steps and appointment availability.', 'Thank you!'
      ].join('\n');
      const subject = 'Auto glass quote — ' + payload.service;
      if (selectedPhotos.length) payload.photos = [];
      fallback.hidden = true;
      success.hidden = true;
      formStatus.textContent = 'Sending your quote request…';
      formStatus.className = 'form-status';
      submitButton.disabled = true;
      submitButton.firstChild.textContent = 'Sending… ';
      photoInput.disabled = true;
      try {
        for (let i = 0; i < selectedPhotos.length; i++) {
          formStatus.textContent = 'Preparing photo ' + (i + 1) + ' of ' + selectedPhotos.length + '…';
          payload.photos.push(await preparePhoto(selectedPhotos[i], i));
        }
        formStatus.textContent = 'Sending your quote request…';
        const response = await fetch('/api/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.success) {
          const description = result.error || (response.status === 404
            ? 'The quote email function was not found. Check the Vercel deployment.'
            : 'The server did not accept the request.');
          throw new Error('Quote request failed (HTTP ' + response.status + '): ' + description);
        }
        form.reset();
        selectedPhotos = [];
        renderSelectedPhotos();
        photoMessage('');
        formStatus.textContent = '';
        success.hidden = false;
        success.focus({ preventScroll: true });
        success.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
      } catch (error) {
        const safeMessage = error instanceof Error ? error.message : '';
        const photoError = /photo|image|browser/i.test(safeMessage);
        // Show the HTTP status and a safe message so delivery issues are diagnosable.
        // Never include API keys or credentials in client-visible errors.
        formStatus.textContent = photoError || /^Quote request failed \(HTTP \d+\):/.test(safeMessage)
          ? safeMessage
          : 'We couldn’t confirm delivery. Check your connection or try again. You can use the email option below.';
        console.error('Windshield Doctor quote submission failed:', safeMessage || 'Unknown error');
        formStatus.className = 'form-status is-error';
        showFallback(message, subject);
      } finally {
        submitButton.disabled = false;
        photoInput.disabled = false;
        submitButton.firstChild.textContent = 'Send quote request ';
      }
    });
    form.addEventListener('input', () => {
      fallback.hidden = true;
      success.hidden = true;
      formStatus.textContent = '';
      formStatus.className = 'form-status';
    });
    document.querySelector('#copy-quote').addEventListener('click', async () => {
      const message = document.querySelector('#email-preview').textContent;
      try {
        if (!navigator.clipboard) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(message);
        document.querySelector('#copy-status').textContent = 'Copied. Paste this into an email to Windshielddoctorautoglass@gmail.com.';
      } catch (_) {
        const range = document.createRange(); range.selectNodeContents(document.querySelector('#email-preview'));
        const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
        document.querySelector('#copy-status').textContent = 'Your message is selected. Use your device’s Copy command, then paste it into your email.';
      }
    });
  }
  document.querySelector('#load-map')?.addEventListener('click', () => {
    const frame = document.createElement('iframe');
    frame.title = 'Google map: 523 Vidal Street South, Sarnia, Ontario';
    frame.className = 'map-embed'; frame.loading = 'lazy'; frame.referrerPolicy = 'no-referrer-when-downgrade';
    frame.src = 'https://maps.google.com/maps?q=523%20Vidal%20Street%20South%2C%20Sarnia%2C%20ON%20N7T%202V7&output=embed';
    document.querySelector('#map-loader').replaceWith(frame);
  });
})();

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById('formPersona');
    const fileInput = document.getElementById('foto_domicilio');
    const dropzone = document.getElementById('dropzone');
    const previewContainer = document.getElementById('previewContainer');
    
    // Gestión Multimedia: Cámara nativa
    const video = document.getElementById('video');
    const btnCamara = document.getElementById('btnCamara');
    const btnCapturar = document.getElementById('btnCapturar');
    const canvas = document.getElementById('canvas');
    let streamInstancia = null;

    btnCamara.addEventListener('click', async () => {
        try {
            streamInstancia = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
            video.srcObject = streamInstancia;
            video.classList.remove('d-none');
            btnCapturar.classList.remove('d-none');
        } catch (err) {
            Swal.fire('Error de hardware', 'No se logró inicializar el acceso a la cámara periférica.', 'error');
        }
    });

    btnCapturar.addEventListener('click', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        
        // Convertir frame del canvas en archivo BLOB simulando carga física
        canvas.toBlob((blob) => {
            const archivoCapturado = new File([blob], "captura_camara.webp", { type: "image/webp" });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(archivoCapturado);
            fileInput.files = dataTransfer.files;

            // Renderizar Vista previa instantánea
            previewContainer.innerHTML = `<img src="${URL.createObjectURL(blob)}" class="img-thumbnail" style="max-height:120px;">`;
            
            // Detener flujos de cámara por ahorro energético
            streamInstancia.getTracks().forEach(track => track.stop());
            video.classList.add('d-none');
            btnCapturar.classList.add('d-none');
        }, 'image/webp', 0.85);
    });

    // Gestión Drag & Drop
    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('bg-secondary-subtle'); });
    dropzone.addEventListener('dragleave', () => { dropzone.classList.remove('bg-secondary-subtle'); });
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('bg-secondary-subtle');
        if(e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            const file = e.dataTransfer.files[0];
            previewContainer.innerHTML = `<img src="${URL.createObjectURL(file)}" class="img-thumbnail" style="max-height:120px;">`;
        }
    });

    fileInput.addEventListener('change', () => {
        if(fileInput.files.length) {
            const file = fileInput.files[0];
            previewContainer.innerHTML = `<img src="${URL.createObjectURL(file)}" class="img-thumbnail" style="max-height:120px;">`;
        }
    });

    // Envío Asíncrono e Intercepción de Formulario
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Validaciones estrictas del lado del cliente
        const dni = form.elements['dni'].value;
        const celular = form.elements['celular'].value;

        if (!/^\d{8}$/.test(dni)) {
            Swal.fire('Validación', 'El formato del DNI debe ser exactamente de 8 dígitos.', 'warning');
            return;
        }
        if (!/^\d{9}$/.test(celular)) {
            Swal.fire('Validación', 'El número celular debe comprender exactamente 9 dígitos.', 'warning');
            return;
        }
        if (!form.elements['latitud'].value) {
            Swal.fire('Ubicación requerida', 'Por favor marque un punto válido en el mapa dinámico.', 'warning');
            return;
        }

        const formData = new FormData(form);

        Swal.fire({
            title: 'Procesando operación',
            text: 'Subiendo información y cifrando metadatos.',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        fetch('guardar.php', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            Swal.close();
            if (data.status === 'success') {
                Swal.fire('¡Éxito!', data.message, 'success').then(() => {
                    window.location.href = 'listado.php';
                });
            } else {
                Swal.fire('Error operacional', data.message, 'error');
            }
        })
        .catch(err => {
            Swal.close();
            Swal.fire('Error fatal', 'No se pudo establecer conexión con el endpoint del servidor.', 'error');
        });
    });
});
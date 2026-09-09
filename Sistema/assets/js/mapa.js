document.addEventListener("DOMContentLoaded", function () {
    // Coordenadas por defecto iniciales (Eje: Plaza de Armas de Ica, Perú)
    let defaultLat = -14.063943;
    let defaultLng = -75.729156;

    // Verificar si existen datos previos cargados en la interfaz (Modo Edición)
    const inputLat = document.getElementById('latitud');
    const inputLng = document.getElementById('longitud');

    if (inputLat.value && inputLng.value) {
        defaultLat = parseFloat(inputLat.value);
        defaultLng = parseFloat(inputLng.value);
    }

    // Inicializar el contenedor del Mapa interactivo
    const map = L.map('map').setView([defaultLat, defaultLng], 15);

    // Renderizar la capa de mosaicos de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© Colaboradores de OpenStreetMap'
    }).addTo(map);

    // Instanciar Marcador deslizable principal
    let marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);

    // Actualizar inputs al arrastrar el marcador manualmente
    function updateCoords(lat, lng) {
        inputLat.value = lat.toFixed(8);
        inputLng.value = lng.toFixed(8);
    }

    // Escuchar el evento de arrastre del pin
    marker.on('dragend', function (e) {
        const position = marker.getLatLng();
        updateCoords(position.lat, position.lng);
    });

    // Escuchar clic en cualquier parte del mapa para reubicar marcador
    map.on('click', function (e) {
        marker.setLatLng(e.latlng);
        updateCoords(e.latlng.lat, e.latlng.lng);
    });

    // Geolocalización del Dispositivo vía API de Navegador HTML5
    document.getElementById('btnGPS').addEventListener('click', function () {
        if (!navigator.geolocation) {
            Swal.fire('Error', 'Su navegador no soporta geolocalización nativa.', 'error');
            return;
        }

        Swal.fire({
            title: 'Localizando...',
            text: 'Obteniendo coordenadas de alta precisión.',
            didOpen: () => { Swal.showLoading(); }
        });

        navigator.geolocation.getCurrentPosition(function (position) {
            Swal.close();
            const currentLat = position.coords.latitude;
            const currentLng = position.coords.longitude;

            map.setView([currentLat, currentLng], 17);
            marker.setLatLng([currentLat, currentLng]);
            updateCoords(currentLat, currentLng);
        }, function (error) {
            Swal.fire('Error', 'No se pudo obtener la ubicación exacta: ' + error.message, 'error');
        }, { enableHighAccuracy: true, timeout: 10000 });
    });
});
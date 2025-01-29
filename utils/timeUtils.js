
// Función para convertir "08:00 a.m." en "08:00" y "08:00 p.m." en "20:00"
function convertTo24HourFormat(timeString) {
    let [time, modifier] = timeString.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (modifier && modifier.toLowerCase() === 'p.m.' && hours !== 12) {
        hours += 12;
    }
    if (modifier && modifier.toLowerCase() === 'a.m.' && hours === 12) {
        hours = 0;
    }

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// Exportar la función para poder usarla en otros archivos
module.exports = convertTo24HourFormat;

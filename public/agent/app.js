//Colour Picker
function setColor(input){
    const lightness = getLightnessFromHex(input.value)
    console.log(input.value)
    const isLight = lightness > 60
    const root = document.documentElement
    root.style.setProperty('--base-color', input.value)
    root.style.setProperty('--text-color', isLight ? 'black' : 'white')
    root.style.setProperty('--surface-direction', isLight ? -1 : 1)
}

function getLightnessFromHex(hex) {
    hex = hex.replace(/^#/, '') //Replce the # with blank
    
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)

    //perceived brightness formula
    const brightness = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255

    return +(brightness *100).toFixed(2);
}
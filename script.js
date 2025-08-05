const fileInput = document.getElementById('file-input');
const canvas = document.getElementById('crt-canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const downloadBtn = document.getElementById('download-btn');
const statusEl = document.getElementById('status');
const scanlineSlider = document.getElementById('scanline-slider');
const dotSizeSlider = document.getElementById('dotsize-slider');
const bleedSlider = document.getElementById('bleed-slider');
const rgbShiftSlider = document.getElementById('rgbshift-slider');

let originalImage = new Image();
let currentImageData = null;

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) {
        return;
    }

    statusEl.textContent = 'Processing image...';
    downloadBtn.classList.add('hidden');

    const reader = new FileReader();
    reader.onload = (event) => {
        originalImage.onload = () => {
            canvas.width = originalImage.width;
            canvas.height = originalImage.height;

            ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
            currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            applyCRTEffect();

            statusEl.textContent = 'CRT effect applied successfully!';
            downloadBtn.classList.remove('hidden');
        };
        originalImage.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

[scanlineSlider, dotSizeSlider, bleedSlider, rgbShiftSlider].forEach(slider => {
    slider.addEventListener('input', () => {
        if (currentImageData) {
            applyCRTEffect();
        }
    });
});

function applyCRTEffect() {
    if (!currentImageData) return;

    ctx.putImageData(currentImageData, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    const scanlineIntensity = parseInt(scanlineSlider.value, 10);
    const dotSize = parseInt(dotSizeSlider.value, 10);
    const bleedAmount = parseInt(bleedSlider.value, 10);
    const rgbShiftAmount = parseInt(rgbShiftSlider.value, 10);

    const newImageData = new Uint8ClampedArray(data.length);
    newImageData.set(data);

    for (let i = 0; i < data.length; i += 4) {
        const x = (i / 4) % width;
        const y = Math.floor(i / 4 / width);

        if (y % dotSize !== 0) {
            newImageData[i] = Math.max(0, newImageData[i] - scanlineIntensity);
            newImageData[i + 1] = Math.max(0, newImageData[i + 1] - scanlineIntensity);
            newImageData[i + 2] = Math.max(0, newImageData[i + 2] - scanlineIntensity);
        }

        const bleedX = x - Math.floor(bleedAmount / 10);
        if (bleedX >= 0) {
            newImageData[i] = newImageData[bleedX * 4 + y * width * 4];
            newImageData[i + 1] = newImageData[bleedX * 4 + y * width * 4 + 1];
            newImageData[i + 2] = newImageData[bleedX * 4 + y * width * 4 + 2];
        }

        const redIndex = (x - rgbShiftAmount) * 4 + y * width * 4;
        const blueIndex = (x + rgbShiftAmount) * 4 + y * width * 4;
        
        if (redIndex >= 0 && redIndex < data.length) {
            newImageData[i] = data[redIndex];
        }
        if (blueIndex >= 0 && blueIndex < data.length) {
            newImageData[i + 2] = data[blueIndex + 2];
        }
    }

    imageData.data.set(newImageData);
    ctx.putImageData(imageData, 0, 0);
}

downloadBtn.addEventListener('click', () => {
    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'crt_image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

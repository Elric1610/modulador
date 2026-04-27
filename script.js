function textToBinary(text) {
    return text.split('').map(char => {
        return char.charCodeAt(0).toString(2).padStart(8, '0');
    }).join('');
}

function process() {
    const text = document.getElementById('inputText').value;
    const binary = textToBinary(text);
    
    const outputText = binary ? binary.match(/.{1,8}/g).join(' ') : "Esperando entrada...";
    document.getElementById('binaryOutput').innerText = "Binario: " + outputText;
    
    const container = document.getElementById('chartsContainer');
    container.innerHTML = ''; 

    const checkboxes = document.querySelectorAll('#codeTypes input[type="checkbox"]:checked');

    if (binary && checkboxes.length > 0) {
        checkboxes.forEach(checkbox => {
            const type = checkbox.value;
            // Aquí obtenemos el texto del botón visual (la etiqueta <label> que le sigue al input)
            const titleText = checkbox.nextElementSibling.innerText; 

            const wrapper = document.createElement('div');
            wrapper.className = 'chart-wrapper';

            const title = document.createElement('h3');
            title.innerText = titleText;
            wrapper.appendChild(title);

            const canvas = document.createElement('canvas');
            canvas.width = 1000;
            canvas.height = 180; 
            wrapper.appendChild(canvas);

            container.appendChild(wrapper);

            drawSignal(canvas, binary, type);
        });
    }
}

function drawSignal(canvas, bits, type) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const midY = h / 2; 
    
    const stepX = w / Math.max(bits.length, 16); 
    const amplitude = 50; 

    ctx.clearRect(0, 0, w, h);
    
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let i = 0; i <= w; i += stepX) { 
        ctx.moveTo(i, 0); 
        ctx.lineTo(i, h); 
    }
    ctx.stroke();

    ctx.strokeStyle = "#e74c3c"; 
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(w, midY);
    ctx.stroke();

    ctx.strokeStyle = "#2980b9"; 
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.beginPath();

    let currentLevel = 1; 
    let lastAmiPolarity = 1; 
    let x = 0;
    
    for (let i = 0; i < bits.length; i++) {
        let bit = parseInt(bits[i]);
        let yValues = [];

        switch (type) {
            case 'nrz': yValues = [bit === 1 ? midY - amplitude : midY]; break;
            case 'nrzl': yValues = [bit === 0 ? midY - amplitude : midY + amplitude]; break;
            case 'nrzi': 
                if (bit === 1) currentLevel *= -1;
                yValues = [midY + (currentLevel * amplitude)]; 
                break;
            case 'manchester': 
                yValues = bit === 1 ? [midY - amplitude, midY + amplitude] : [midY + amplitude, midY - amplitude]; 
                break;
            case 'manchesterDiff': 
                if (bit === 1) currentLevel *= -1;
                yValues = [midY + (currentLevel * amplitude), midY + (currentLevel * -1 * amplitude)];
                currentLevel *= -1; 
                break;
            case 'ami': 
                if (bit === 1) {
                    yValues = [midY - (lastAmiPolarity * amplitude)];
                    lastAmiPolarity *= -1;
                } else { yValues = [midY]; }
                break;
            case 'pseudo': 
                if (bit === 0) {
                    yValues = [midY - (lastAmiPolarity * amplitude)];
                    lastAmiPolarity *= -1;
                } else { yValues = [midY]; }
                break;
        }

        yValues.forEach((targetY, index) => {
            let segmentW = stepX / yValues.length;
            if (i === 0 && index === 0) { ctx.moveTo(x, targetY); } 
            else { ctx.lineTo(x, targetY); }
            ctx.lineTo(x + segmentW, targetY); 
            x += segmentW;
        });
    }
    ctx.stroke();

    ctx.fillStyle = "#333";
    ctx.font = "bold 14px monospace";
    ctx.textAlign = "center";
    
    let labelX = 0;
    for (let i = 0; i < bits.length; i++) {
        let bitText = bits[i];
        let labelY = midY - amplitude - 8; 
        ctx.fillText(bitText, labelX + (stepX / 2), labelY);
        labelX += stepX;
    }
}
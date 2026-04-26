// script.js
let datosCalculados = null;

function procesarTexto() {
    const textoOriginal = document.getElementById("textoInput").value;
    const texto = textoOriginal.toUpperCase();
    if (!texto) return;

    // Mostramos contenedores de forma instantánea
    document.getElementById("placeholder").style.display = 'none';
    const infoBinariaDiv = document.getElementById("info-binaria");
    infoBinariaDiv.style.display = 'flex';
    infoBinariaDiv.innerHTML = '';
    
    let bits = [];
    
    // Extracción de bits y visualización inmediata en pantalla
    for (let i = 0; i < texto.length; i++) {
        let char = texto[i];
        let bin = texto.charCodeAt(i).toString(2).padStart(8, '0');
        
        let block = document.createElement('div');
        block.className = 'char-block';
        let label = document.createElement('span'); 
        label.className = 'char-label'; 
        label.innerText = char;
        let binarySpan = document.createElement('span'); 
        binarySpan.className = 'char-binary'; 
        binarySpan.innerText = bin;
        
        block.appendChild(label); 
        block.appendChild(binarySpan);
        infoBinariaDiv.appendChild(block);

        // Guardamos los bits para las matemáticas
        for (let b of bin) bits.push(parseInt(b));
    }

    // --- Lógica matemática de las señales ---
    const n_bits = bits.length;
    const Tb = 1.0, fc = 2.0, fc0 = 1.0, fc1 = 3.0, fs = 150;     
    const num_muestras = n_bits * Tb * fs;

    let t = new Float64Array(num_muestras);
    let s_digital = new Float64Array(num_muestras);
    let s_ask = new Float64Array(num_muestras);
    let s_fsk = new Float64Array(num_muestras);
    let s_psk = new Float64Array(num_muestras);
    let s_qam = new Float64Array(num_muestras);

    const mapeo_I = { '00': -1, '01': -1, '10': 1, '11': 1 };
    const mapeo_Q = { '00': -1, '01': 1,  '10': -1, '11': 1 };

    for (let i = 0; i < n_bits; i++) {
        const bit = bits[i];
        let I = 0, Q = 0;
        if (i % 2 === 0) {
            const b1 = bits[i], b2 = (i + 1 < n_bits) ? bits[i + 1] : 0;
            I = mapeo_I["" + b1 + b2]; Q = mapeo_Q["" + b1 + b2];
        } else {
            const b1 = bits[i - 1], b2 = bits[i];
            I = mapeo_I["" + b1 + b2]; Q = mapeo_Q["" + b1 + b2];
        }

        for (let j = 0; j < fs; j++) {
            let idx = i * fs + j;
            let tiempo = idx * (1 / fs);
            t[idx] = tiempo;
            s_digital[idx] = bit;
            let portadora = Math.sin(2 * Math.PI * fc * tiempo);
            s_ask[idx] = bit * portadora;
            s_fsk[idx] = Math.sin(2 * Math.PI * ((bit === 1) ? fc1 : fc0) * tiempo);
            s_psk[idx] = ((bit === 1) ? 1 : -1) * portadora;
            s_qam[idx] = I * Math.cos(2 * Math.PI * fc * tiempo) - Q * Math.sin(2 * Math.PI * fc * tiempo);
        }
    }

    datosCalculados = { t, s_digital, s_ask, s_fsk, s_psk, s_qam };
    dibujarGraficas();
}

function dibujarGraficas() {
    if (!datosCalculados) return;

    const graficasDiv = document.getElementById("graficas");
    const selecciones = [];

    // Selección dinámica de colores y ondas a mostrar
    if (document.getElementById("chk-base").checked) selecciones.push({name: 'Base', data: datosCalculados.s_digital, color: '#f85149', isDigital: true}); 
    if (document.getElementById("chk-ask").checked) selecciones.push({name: 'ASK', data: datosCalculados.s_ask, color: '#58a6ff', isDigital: false}); 
    if (document.getElementById("chk-fsk").checked) selecciones.push({name: 'FSK', data: datosCalculados.s_fsk, color: '#3fb950', isDigital: false}); 
    if (document.getElementById("chk-psk").checked) selecciones.push({name: 'BPSK', data: datosCalculados.s_psk, color: '#bc8cff', isDigital: false}); 
    if (document.getElementById("chk-qam").checked) selecciones.push({name: '4-QAM', data: datosCalculados.s_qam, color: '#d29922', isDigital: false}); 

    if (selecciones.length === 0) {
        graficasDiv.style.display = 'none';
        return;
    }

    graficasDiv.style.display = 'block';

    let traces = [];
    let layoutAxes = {};
    const totalTraces = selecciones.length;
    let axisIndex = 1;

    selecciones.forEach(sel => {
        let axName = axisIndex === 1 ? '' : axisIndex;
        let xaxisName = 'x' + axName;
        let yaxisName = 'y' + axName;

        traces.push({
            x: datosCalculados.t, 
            y: sel.data, 
            type: 'scatter', 
            mode: 'lines',
            line: { color: sel.color, shape: sel.isDigital ? 'hv' : 'linear', width: 1.8 },
            xaxis: xaxisName, 
            yaxis: yaxisName, 
            name: sel.name
        });
        
        // Configuración individual de cada Eje Y
        layoutAxes['yaxis' + axName] = {
            title: { text: sel.name, font: { color: '#8b949e' } },
            gridcolor: '#21262d', 
            zerolinecolor: '#30363d',
            range: sel.isDigital ? [-0.5, 1.5] : [-1.5, 1.5],
            tickfont: { color: '#484f58' }
        };

        // Configuración individual de cada Eje X
        layoutAxes['xaxis' + axName] = {
            matches: 'x', 
            gridcolor: '#21262d', 
            zerolinecolor: '#30363d',
            tickfont: { color: '#484f58' },
            showticklabels: axisIndex === totalTraces // Solo muestra los números del eje X en la gráfica de hasta abajo
        };
        
        axisIndex++;
    });

    const alturaTotal = Math.max(350, selecciones.length * 180);

    const layout = {
        height: alturaTotal, 
        margin: { t: 30, b: 40, l: 60, r: 30 }, 
        showlegend: false,
        hovermode: 'x unified',
        paper_bgcolor: 'rgba(0,0,0,0)', 
        plot_bgcolor: 'rgba(0,0,0,0)',  
        font: { color: '#8b949e' },
        // Sistema grid de Plotly para asegurar filas limpias sin traslapos
        grid: {
            rows: totalTraces,
            columns: 1,
            pattern: 'independent',
            roworder: 'top to bottom'
        },
        hoverlabel: { bgcolor: '#161b22', bordercolor: '#30363d', font: {color: '#e6edf3'} },
        ...layoutAxes 
    };

    Plotly.newPlot('graficas', traces, layout, { responsive: true });
}
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const uploadButton = document.getElementById('uploadButton');
    const waveform = document.getElementById('waveform');
    const spectrogram = document.getElementById('spectrogram');
    const playButton = document.getElementById('playButton');
    const pauseButton = document.getElementById('pauseButton');
    const progressSlider = document.getElementById('progressSlider');
    const volumeSlider = document.getElementById('volumeSlider');
    const forwardButton = document.querySelector('.fa-forward');
    const backwardButton = document.querySelector('.fa-backward');
    const downloadVideoButton = document.getElementById('downloadWaveform');

    let audioContext;
    let analyser;
    let source;
    let buffer;
    let gainNode; // Gain node for volume control
    let isPlaying = false;
    let currentTime = 0; // Track the current time

    uploadButton.addEventListener('click', () => {
        if (fileInput.files.length === 0) {
            alert('Please upload an audio file.');
            return;
        }
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = () => {
            const audioData = reader.result;
            initAudioContext(audioData);
        };
        reader.readAsArrayBuffer(file);
    });

    function initAudioContext(audioData) {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            gainNode = audioContext.createGain(); // Create the gain node
            gainNode.connect(analyser);
            analyser.connect(audioContext.destination);
        }

        audioContext.decodeAudioData(audioData, (decodedData) => {
            if (source) {
                source.disconnect();
            }

            buffer = decodedData;
            source = audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(gainNode); // Connect source to gain node
            gainNode.connect(analyser); // Connect gain node to analyser
            analyser.connect(audioContext.destination);

            drawWaveform();
            drawSpectrogram();
        });
    }

    function drawWaveform() {
        const canvas = document.createElement('canvas');
        canvas.width = waveform.clientWidth;
        canvas.height = waveform.clientHeight;
        waveform.innerHTML = '';
        waveform.appendChild(canvas);

        const canvasContext = canvas.getContext('2d');
        const bufferLength = analyser.fftSize;
        const dataArray = new Uint8Array(bufferLength);

        analyser.fftSize = 2048;
        const barWidth = canvas.width / bufferLength;
        const barHeight = canvas.height / 2;
        canvasContext.fillStyle = '#e91e63';
        canvasContext.strokeStyle = '#e91e63';
        
        function draw() {
            requestAnimationFrame(draw);
            analyser.getByteTimeDomainData(dataArray);
            canvasContext.clearRect(0, 0, canvas.width, canvas.height);
            canvasContext.beginPath();
            let sliceWidth = canvas.width * 1.0 / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                let v = dataArray[i] / 128.0;
                let y = v * barHeight;
                if (i === 0) {
                    canvasContext.moveTo(x, y);
                } else {
                    canvasContext.lineTo(x, y);
                }
                x += sliceWidth;
            }
            canvasContext.lineTo(canvas.width, canvas.height / 2);
            canvasContext.stroke();
        }
        draw();
    }

    function drawSpectrogram() {
        const canvas = document.createElement('canvas');
        canvas.width = spectrogram.clientWidth;
        canvas.height = spectrogram.clientHeight;
        spectrogram.innerHTML = '';
        spectrogram.appendChild(canvas);

        const canvasContext = canvas.getContext('2d');
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        function draw() {
            requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);
            canvasContext.clearRect(0, 0, canvas.width, canvas.height);
            const barWidth = (canvas.width / bufferLength) * 2.5;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const barHeight = dataArray[i];
                canvasContext.fillStyle = '#e91e63';
                canvasContext.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }
        }
        draw();
    }

    // Play/Pause button functionality
    function togglePlayPause() {
        if (isPlaying) {
            source.stop();
            playButton.style.display = 'inline-flex';
            pauseButton.style.display = 'none';
            isPlaying = false;
        } else {
            source = audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(gainNode); // Connect source to gain node
            gainNode.connect(analyser); // Connect gain node to analyser
            analyser.connect(audioContext.destination);
            source.start(0, currentTime % buffer.duration); // Start at the current time
            playButton.style.display = 'none';
            pauseButton.style.display = 'inline-flex';
            isPlaying = true;
            updateSlider();
        }
    }

    playButton.addEventListener('click', togglePlayPause);
    pauseButton.addEventListener('click', togglePlayPause);

    // Update progress slider with audio time
    function updateSlider() {
        if (isPlaying) {
            const duration = buffer.duration;
            progressSlider.value = (currentTime / duration) * 100;
        }
        requestAnimationFrame(updateSlider);
    }

    progressSlider.addEventListener('input', () => {
        if (isPlaying) {
            const duration = buffer.duration;
            currentTime = (progressSlider.value / 100) * duration;
            source.stop();
            source = audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(gainNode); // Connect source to gain node
            gainNode.connect(analyser); // Connect gain node to analyser
            analyser.connect(audioContext.destination);
            source.start(0, currentTime % buffer.duration);
        } else {
            currentTime = (progressSlider.value / 100) * buffer.duration;
        }
    });

    // Volume slider functionality
    volumeSlider.addEventListener('input', () => {
        const volume = volumeSlider.value / 100;
        gainNode.gain.value = volume; // Update gain node volume
    });

    // Forward and Backward button functionality
    forwardButton.addEventListener('click', () => {
        if (isPlaying) {
            const duration = buffer.duration;
            currentTime = Math.min(currentTime + 10, duration); // Move forward 10 seconds
            updateSlider();
            source.stop();
            source = audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(gainNode); // Connect source to gain node
            gainNode.connect(analyser); // Connect gain node to analyser
            analyser.connect(audioContext.destination);
            source.start(0, currentTime % buffer.duration);
        } else {
            currentTime = Math.min(currentTime + 10, buffer.duration); // Move forward 10 seconds
            progressSlider.value = (currentTime / buffer.duration) * 100;
        }
    });

    backwardButton.addEventListener('click', () => {
        if (isPlaying) {
            currentTime = Math.max(currentTime - 10, 0); // Move backward 10 seconds
            updateSlider();
            source.stop();
            source = audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(gainNode); // Connect source to gain node
            gainNode.connect(analyser); // Connect gain node to analyser
            analyser.connect(audioContext.destination);
            source.start(0, currentTime % buffer.duration);
        } else {
            currentTime = Math.max(currentTime - 10, 0); // Move backward 10 seconds
            progressSlider.value = (currentTime / buffer.duration) * 100;
        }
    });

    async function generateVideo() {
        if (!buffer) {
            alert('No audio loaded.');
            return;
        }

        // Load FFmpeg library
        const { createFFmpeg, fetchFile } = window.FFmpeg;
        const ffmpeg = createFFmpeg({ log: true });

        await ffmpeg.load();

        // Capture waveform and spectrogram frames
        const numFrames = 30; // Number of frames for the video
        const frameRate = 30; // Frame rate of the video
        const duration = buffer.duration;
        const interval = duration / numFrames;

        let frameData = [];

        for (let i = 0; i < numFrames; i++) {
            const time = i * interval;

            // Update progress slider to capture frame
            progressSlider.value = (time / duration) * 100;

            // Draw waveform frame
            const waveformCanvas = document.createElement('canvas');
            waveformCanvas.width = waveform.clientWidth;
            waveformCanvas.height = waveform.clientHeight;
            const waveformContext = waveformCanvas.getContext('2d');
            waveformContext.drawImage(waveform.querySelector('canvas'), 0, 0);
            const waveformFrame = waveformCanvas.toDataURL('image/png');
            frameData.push(waveformFrame);

            // Draw spectrogram frame
            const spectrogramCanvas = document.createElement('canvas');
            spectrogramCanvas.width = spectrogram.clientWidth;
            spectrogramCanvas.height = spectrogram.clientHeight;
            const spectrogramContext = spectrogramCanvas.getContext('2d');
            spectrogramContext.drawImage(spectrogram.querySelector('canvas'), 0, 0);
            const spectrogramFrame = spectrogramCanvas.toDataURL('image/png');
            frameData.push(spectrogramFrame);
        }

        // Create video file with FFmpeg
        const videoFrames = frameData.map((frame, index) => {
            const frameName = `frame_${index}.png`;
            return { name: frameName, data: frame };
        });

        for (let i = 0; i < videoFrames.length; i++) {
            const { name, data } = videoFrames[i];
            const response = await fetch(data);
            const arrayBuffer = await response.arrayBuffer();
            ffmpeg.FS('writeFile', name, new Uint8Array(arrayBuffer));
        }

        await ffmpeg.run('-framerate', `${frameRate}`, '-i', 'frame_%d.png', 'output.mp4');
        const data = ffmpeg.FS('readFile', 'output.mp4');

        // Download the video
        const videoBlob = new Blob([data.buffer], { type: 'video/mp4' });
        const videoUrl = URL.createObjectURL(videoBlob);
        const downloadLink = document.createElement('a');
        downloadLink.href = videoUrl;
        downloadLink.download = 'visualization.mp4';
        downloadLink.click();

        // Cleanup
        URL.revokeObjectURL(videoUrl);
    }

    downloadVideoButton.addEventListener('click', generateVideo);
});

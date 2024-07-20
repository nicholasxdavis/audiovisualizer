// Flags to track file selection and upload status
    let fileSelected = false;
    let fileUploaded = false;

    function closePopup() {
        document.querySelector('.popup-overlay').style.display = 'none';
    }

    function showPopup() {
        document.querySelector('.popup-overlay').style.display = 'flex';
    }

    document.getElementById('fileInput').addEventListener('change', function(event) {
        var file = event.target.files[0];
        var titleElement = document.getElementById('fileNameTitle');

        if (file) {
            fileSelected = true; // Set the flag to true when a file is selected
            fileUploaded = false; // Reset the upload status
            var fileName = file.name;
            var audio = new Audio(URL.createObjectURL(file));

            // Display file name
            titleElement.textContent = fileName;
            titleElement.classList.add('show');

            // Display file size and format
            var audioSize = (file.size / 1024).toFixed(2) + ' KB';
            var audioFormat = file.type || 'N/A';

            document.getElementById('audioSize').textContent = audioSize;
            document.getElementById('audioFormat').textContent = audioFormat;

            // Get audio duration
            audio.addEventListener('loadedmetadata', function() {
                var minutes = Math.floor(audio.duration / 60);
                var seconds = Math.floor(audio.duration % 60);
                var audioDuration = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
                document.getElementById('audioDuration').textContent = audioDuration;
            });

            // Change button style when a file is selected
            document.getElementById('uploadButton').classList.add('selected');
        } else {
            // Reset file name and hide stats table if no file is selected
            titleElement.textContent = 'Title Goes Here';
            titleElement.classList.remove('show');
            document.getElementById('audioSize').textContent = '0 KB';
            document.getElementById('audioFormat').textContent = 'N/A';
            document.getElementById('audioDuration').textContent = 'N/A';
            fileSelected = false; // Reset the file selection flag
            fileUploaded = false; // Reset the file upload status
        }
    });

    document.getElementById('uploadButton').addEventListener('click', function() {
        if (fileSelected) {
            fileUploaded = true; // Mark file as uploaded
            var stateTable = document.getElementById('stateTable');
            stateTable.style.display = 'table'; // Show the table when the upload button is clicked
        }
    });

    function handleControlClick() {
        if (fileSelected && !fileUploaded) {
            showPopup();
        } else {
            // Your play/rewind/fast forward functionality here
        }
    }

    document.getElementById('playButton').addEventListener('click', handleControlClick);
    document.getElementById('rewindButton').addEventListener('click', handleControlClick);
    document.getElementById('fastForwardButton').addEventListener('click', handleControlClick);

    document.querySelector('.popup-close').addEventListener('click', closePopup);
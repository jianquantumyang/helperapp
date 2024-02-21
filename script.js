document.addEventListener('DOMContentLoaded', function () {
  const inputField = document.querySelector('.inp');
  const button = document.querySelector('.button');
  const resultParagraph = document.querySelector('.paragraph');
  const container = document.getElementById('container');
  let isRecording = false;
  let mediaRecorder;
  let audioChunks = [];

  inputField.addEventListener('input', function (e) {
    container.style.height = 'auto';
    container.style.height = container.scrollHeight + 'px';
    const windowContentHeight = container.scrollHeight + 20;
    const currentWindowHeight = window.innerHeight;

    if (windowContentHeight > currentWindowHeight) {
      const heightDifference = windowContentHeight - currentWindowHeight;
      window.resizeTo(window.innerWidth, window.innerHeight + heightDifference);
    }

    toggleButtonIcon(e.target.value.trim().length !== 0);
  });

  button.addEventListener('click', async function () {
    const inputValue = inputField.value;

    if (inputValue.trim().length === 0) {
      // Microphone icon is clicked, start/stop recording
      isRecording = !isRecording;
      toggleButtonIcon(isRecording);

      if (isRecording) {
        startRecording();
      } else {
        stopRecording();
      }
    } else {
      // Send text message to server
      try {
        const response = await fetch(`https://helperbackend.pythonanywhere.com/chattxt/`, {
          body: JSON.stringify({ message: inputValue }),
          method: 'POST',
        });
        const data = await response.json();

        resultParagraph.innerHTML = formatChatML(data.answer);
      } catch (error) {
        console.error(error);
      }
    }
  });

  function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = function (e) {
          if (e.data.size > 0) {
            audioChunks.push(e.data);
          }
        };

        mediaRecorder.onstop = function () {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          sendAudioToServer(audioBlob);
          toggleButtonIcon(false,false);
          audioChunks = [];
        };

        mediaRecorder.start();
        mediaRecorder.onstart = function () {
          // Ensure mediaRecorder has started before updating the icon
          toggleButtonIcon(false,true);
        };
      })
      .catch((error) => {
        console.error('Error accessing microphone:', error);
      });
  }


  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  }

  function sendAudioToServer(audioBlob) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');

    fetch('https://helperbackend.pythonanywhere.com/chatstt/', {
      method: 'POST',
      body: formData,
    })
      .then(response => response.json())
      .then(data => {
        resultParagraph.innerHTML = formatChatML(data.answer);
      })
      .catch(error => console.error('Error sending audio to server:', error));
  }

  function toggleButtonIcon(hasValue,recording=false) {
    if (hasValue) {
      button.innerHTML = '<img src="./rightarrow.svg" />';

    } 
    else if(recording ){
      button.innerHTML = '<img src="./stop.svg" />';
    }else {
      button.innerHTML = isRecording ? '<img src="./stop.svg" />' : '<img src="./micro.svg" />';
    }
  }
  

  function formatChatML(chatML) {
    let formattedText = chatML.replace(/\n/g, '<br>');

    formattedText = formattedText.replace(/```([^`]+)```/g, (match, code) => {
      return `<code>${code}</code>`;
    });

    return formattedText;
  }

  inputField.dispatchEvent(new Event('input'));
});

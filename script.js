document.addEventListener('DOMContentLoaded', () => {
  const questionForm = document.getElementById('question-form');
  const questionsPreview = document.getElementById('questions-preview');
  const optionsContainer = document.getElementById('options-container');
  const addOptionButton = document.getElementById('add-option');
  const exportTxtButton = document.getElementById('export-txt');
  const importTxtInput = document.getElementById('import-txt');
  const toggleViewButton = document.getElementById('toggle-view');
  const mainContainer = document.getElementById('main-container');
  const questionsList = document.getElementById('questions-list');
  const autosaveIntervalSelect = document.getElementById('autosave-interval');
  const timerDisplay = document.getElementById('timer-display'); // Temporizador visual
  let autosaveTimer;
  let countdown;
  let questions = [];
  let editingIndex = null;

  // Alternar entre vista de una y dos columnas
  toggleViewButton.addEventListener('click', () => {
    const isSingleColumn = mainContainer.classList.toggle('grid-cols-1');
    mainContainer.classList.toggle('grid-cols-2');

    if (!isSingleColumn) {
      questionsList.classList.add('overflow-y-scroll', 'h-[40rem]'); // Scroll más alto
    } else {
      questionsList.classList.remove('overflow-y-scroll', 'h-[40rem]'); // Sin scroll
    }    

    Swal.fire({
      icon: 'info',
      title: isSingleColumn ? 'Vista de una columna' : 'Vista de dos columnas',
      text: 'Has cambiado la vista para trabajar de forma más cómoda.',
      confirmButtonText: 'OK',
    });
  });

  addOptionButton.addEventListener('click', () => addOption());

  function addOption(value = '') {
    const optionDiv = document.createElement('div');
    optionDiv.classList.add('flex', 'mb-2', 'items-center');

    optionDiv.innerHTML = `
      <input type="radio" name="correct-option" class="ml-2 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500" title="Respuesta correcta">
      <input type="text" class="w-full p-2 border rounded option-input ml-2" placeholder="Nueva opción" value="${value}" title="Respuesta">
      <button type="button" class="ml-2 bg-yellow-500 text-white w-7 h-7 rounded flex items-center justify-center hover:bg-yellow-800 remove-option" title="Eliminar respuesta">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;

    optionsContainer.appendChild(optionDiv);

    optionDiv.querySelector('.remove-option').addEventListener('click', () => {
      if (optionsContainer.childElementCount > 2) {
        Swal.fire({
          title: '¿Quiere eliminar posible respuesta?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Sí, eliminar',
          cancelButtonText: 'Cancelar',
        }).then((result) => {
          if (result.isConfirmed) {
            optionDiv.remove();
          }
        });
      } else {
        showAlert('Una pregunta debe tener al menos dos opciones.');
      }
    });
  }

  questionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const questionText = document.getElementById('question').value;
    const options = Array.from(document.querySelectorAll('.option-input')).map(input => input.value);
    const correctOption = Array.from(document.querySelectorAll('input[name="correct-option"]')).findIndex(input => input.checked);

    if (!questionText.trim()) return showAlert('La pregunta no puede estar vacía.');
    if (options.filter(opt => opt.trim()).length < 2) return showAlert('Debe haber al menos dos opciones.');
    if (correctOption === -1) return showAlert('Debes seleccionar una respuesta correcta.');

    const question = { text: questionText, options, correct: correctOption };

    if (editingIndex !== null) {
      questions[editingIndex] = question;
      editingIndex = null;
    } else {
      questions.push(question);
    }

    renderQuestions();
    questionForm.reset();
    optionsContainer.innerHTML = '';
    initializeOptions();
  });

  function showAlert(message) {
    Swal.fire({ icon: 'warning', title: '¡Atención!', text: message, confirmButtonText: 'OK' });
  }

  function renderQuestions() {
    questionsPreview.innerHTML = questions.map((q, index) => `
      <li class="border p-2 rounded bg-gray-50 flex justify-between items-center">
        <div>
          <strong>${index + 1}. ${q.text}</strong>
          <ul class="pl-4">${q.options.map((opt, i) => `<li>${String.fromCharCode(65 + i)}. ${opt} ${i === q.correct ? '✔️' : ''}</li>`).join('')}</ul>
        </div>
        <div class="space-y-1">
          <button onclick="editQuestion(${index})" class="bg-blue-800 text-white w-7 h-7 rounded flex items-center hover:bg-blue-900 justify-center" title="Editar pregunta">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="deleteQuestion(${index})" class="bg-red-500 text-white w-7 h-7 rounded flex items-center hover:bg-red-600 justify-center" title="Eliminar pregunta">
            <i class="fas fa-trash-alt"></i>
          </button>
          <button onclick="moveQuestion(${index}, -1)" class="bg-gray-500 text-white w-7 h-7 rounded flex items-center hover:bg-gray-600 justify-center" title="Mover pregunta arriba">
            <i class="fas fa-arrow-up"></i>
          </button>
          <button onclick="moveQuestion(${index}, 1)" class="bg-gray-500 text-white w-7 h-7 rounded flex items-center hover:bg-gray-600 justify-center" title="Mover pregunta abajo">
            <i class="fas fa-arrow-down"></i>
          </button>
        </div>
      </li>
    `).join('');
  }

  window.editQuestion = (index) => {
    const question = questions[index];
    document.getElementById('question').value = question.text;
    optionsContainer.innerHTML = '';
    question.options.forEach(opt => addOption(opt));
    document.querySelectorAll('input[name="correct-option"]')[question.correct].checked = true;
    editingIndex = index;
  };

  window.deleteQuestion = (index) => {
    Swal.fire({
      title: '¿Eliminar pregunta?',
      text: 'Esta pregunta se eliminará permanentemente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        questions.splice(index, 1);
        renderQuestions();
      }
    });
  };

  window.moveQuestion = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= questions.length) return;
    [questions[index], questions[newIndex]] = [questions[newIndex], questions[index]];
    renderQuestions();
  };

  function initializeOptions() {
    addOption();
    addOption();
  }

  // Exportar preguntas con SweetAlert2
  exportTxtButton.addEventListener('click', () => {
    if (questions.length === 0) {
      return Swal.fire({
        icon: 'warning',
        title: 'No hay preguntas',
        text: 'No hay preguntas para exportar.',
        confirmButtonText: 'OK',
      });
    }

    const content = questions.map(q => {
      const options = q.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n');
      return `${q.text}\n${options}\nANSWER: ${String.fromCharCode(65 + q.correct)}`;
    }).join('\n\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
    a.href = url;
    a.download = 'preguntas_aiken.txt';
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);

    Swal.fire({
      icon: 'success',
      title: '¡Guardado!',
      text: 'Las preguntas han sido exportadas correctamente.',
      confirmButtonText: 'OK',
    });
  });

  // Función para formatear tiempo en mm:ss
  function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  // Iniciar o reiniciar el temporizador de autoguardado
  function startAutosaveTimer() {
    clearInterval(autosaveTimer);
    clearInterval(countdown);

    let interval = parseInt(autosaveIntervalSelect.value);
    let timeRemaining = interval;

    // Actualizar el temporizador visual cada segundo
    countdown = setInterval(() => {
      timeRemaining -= 1000;
      timerDisplay.textContent = formatTime(timeRemaining);

      if (timeRemaining <= 0) {
        clearInterval(countdown);
        triggerAutosave(); // Ejecutar autoguardado
      }
    }, 1000);
  }

  // Ejecutar el autoguardado con SweetAlert2
  function triggerAutosave() {
    Swal.fire({
      icon: 'info',
      title: 'Autoguardado',
      text: 'Es momento de guardar tus preguntas en formato Aiken.',
      showCancelButton: true,
      confirmButtonText: 'Guardar ahora',
      cancelButtonText: 'Más tarde',
    }).then((result) => {
      if (result.isConfirmed) {
        exportTxtButton.click(); // Simular clic en el botón de exportar
      }
      startAutosaveTimer(); // Reiniciar el temporizador
    });
  }

  // Escuchar cambios en el selector de intervalo
  autosaveIntervalSelect.addEventListener('change', startAutosaveTimer);

  // Iniciar el temporizador al cargar la página
  startAutosaveTimer();

  // Importar preguntas desde archivo Aiken
  importTxtInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      parseAiken(content);
      renderQuestions();
    };
    reader.readAsText(file);
  });

  function parseAiken(content) {
    const blocks = content.trim().split('\n\n');
    questions = blocks.map(block => {
      const lines = block.split('\n');
      const text = lines[0];
      const options = lines.slice(1, -1).map(line => line.substring(3));
      const correct = lines[lines.length - 1].split(': ')[1].charCodeAt(0) - 65;
      return { text, options, correct };
    });
  }

  initializeOptions();
  
});

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const encodedWord = params.get("word");
    if (!encodedWord) {
        showToaster("Palavra não encontrada!");
        window.location.href = "word.html";
        return;
    }
    const word = atob(encodedWord).toUpperCase();
    const attempts = word.length + 1;
    createBoard(word.length, attempts);
    createKeyboard();

    window.word = word;
    window.attempts = attempts;
    window.currentAttempt = 0;
    window.currentIndex = 0;
});

function createBoard(length, attempts) {
    const board = document.getElementById("board");
    board.innerHTML = "";
    board.style.gridTemplateColumns = `repeat(${length}, 50px)`;
    for (let i = 0; i < length * attempts; i++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        if (i >= length) {
            cell.style.backgroundColor = "#615458";
        }
        board.appendChild(cell);
    }
}

function createKeyboard() {
    const keyboard = document.getElementById("keyboard");
    keyboard.innerHTML = "";
    const rows = [
        "QWERTYUIOP".split(""),
        "ASDFGHJKL".split(""),
        ["ENTER", ..."ZXCVBNM".split(""), "⌫"]
    ];

    rows.forEach(row => {
        const rowDiv = document.createElement("div");
        rowDiv.classList.add("keyboard-row");
        row.forEach(letter => {
            const button = document.createElement("button");
            button.classList.add("key");
            if (letter === "ENTER" || letter === "⌫") {
                button.classList.add("large");
            }
            button.textContent = letter;
            button.onclick = () => handleKeyPress(letter);
            rowDiv.appendChild(button);
        });
        keyboard.appendChild(rowDiv);
    });
}

document.addEventListener("keydown", (event) => {
    const key = event.key.toUpperCase();
    if (/^[A-Z]$/.test(key)) {
        insertLetter(key);
    } else if (key === "ENTER") {
        checkWord();
    } else if (key === "BACKSPACE") {
        deleteLetter();
    }
});

function insertLetter(letter) {
    const cells = document.querySelectorAll(".cell");
    const wordLength = window.word.length;
    if (window.currentIndex < (window.currentAttempt + 1) * wordLength) {
        cells[window.currentIndex].textContent = letter;
        cells[window.currentIndex].classList.add("active");
        if (window.currentIndex > 0) {
            cells[window.currentIndex - 1].classList.remove("active");
        }
        window.currentIndex++;
    }
}

function deleteLetter() {
    const cells = document.querySelectorAll(".cell");
    const wordLength = window.word.length;
    if (window.currentIndex > window.currentAttempt * wordLength) {
        window.currentIndex--;
        cells[window.currentIndex].textContent = "";
        cells[window.currentIndex].classList.add("active");
    }
}

function showConfetti() {
    const confettiContainer = document.createElement("div");
    confettiContainer.style.position = "absolute";
    confettiContainer.style.top = "0";
    confettiContainer.style.left = "0";
    confettiContainer.style.width = "100%";
    confettiContainer.style.height = "100%";
    confettiContainer.style.pointerEvents = "none"; // Para não atrapalhar a interação com a tela

    // Gerando confetes
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement("div");
        confetti.classList.add("confetti");
        confetti.style.left = `${Math.random() * 100}%`; // Posição aleatória
        confetti.style.animationDuration = `${Math.random() * 2 + 2}s`; // Tempo aleatório de animação
        confetti.style.animationDelay = `${Math.random() * 1}s`; // Delay aleatório para os confetes

        confettiContainer.appendChild(confetti);
    }

    document.body.appendChild(confettiContainer);

    // Remover os confetes após a animação
    setTimeout(() => {
        confettiContainer.remove();
    }, 3000); // Tempo suficiente para a animação
}

function checkWord() {
    const cells = document.querySelectorAll(".cell");
    const wordLength = window.word.length;
    let guess = "";
    for (let i = 0; i < wordLength; i++) {
        guess += cells[window.currentAttempt * wordLength + i].textContent;
    }
    if (guess.length === wordLength) {
        console.log("Palavra enviada: ", guess);

        // Verificando se a palavra existe usando a API do Dicionário Aberto
        fetch(`https://api.dicionario-aberto.net/word/${guess.toLowerCase()}`)
            .then(response => response.json())
            .then(data => {
                if (!data.length) {
                    showToaster("Palavra inexistente!");
                    return;
                }

                // Resetando o status das células antes de adicionar novos highlights
                resetCellHighlights(cells, window.currentAttempt);

                let letterCount = {};
                window.word.split('').forEach(letter => {
                    letterCount[letter] = (letterCount[letter] || 0) + 1;
                });

                // Primeira iteração - Verificando letras corretas
                for (let i = 0; i < guess.length; i++) {
                    if (guess[i] === window.word[i]) {
                        cells[window.currentAttempt * wordLength + i].classList.add("correct");
                        letterCount[guess[i]]--;
                    }
                }

                // Segunda iteração - Verificando letras presentes e ausentes
                for (let i = 0; i < guess.length; i++) {
                    if (guess[i] !== window.word[i]) {
                        if (window.word.includes(guess[i]) && letterCount[guess[i]] > 0) {
                            cells[window.currentAttempt * wordLength + i].classList.add("present");
                            letterCount[guess[i]]--;
                        } else {
                            cells[window.currentAttempt * wordLength + i].classList.add("absent");
                        }
                    }
                }

                // Exibindo confetes se acertar a palavra
                if (guess === window.word) {
                    showConfetti(); // Mostrar confetes após acertar a palavra
                    showToaster("Você acertou a palavra!")
                }

                window.currentAttempt++;
                window.currentIndex = window.currentAttempt * wordLength; // Resetando o índice para a próxima linha
            })
            .catch(() => showToaster("Erro ao verificar palavra"));
    }
}

// Função para desabilitar o teclado físico
function disablePhysicalKeyboard() {
    window.addEventListener("keydown", preventKeyPress, true);
}

// Função para evitar que qualquer tecla seja pressionada
function preventKeyPress(event) {
    event.preventDefault();
}

// Re-ativando o teclado virtual após desabilitar o teclado físico
function enableVirtualKeyboard() {
    // Aqui você reativa a função de teclado virtual se necessário.
    // Exemplo:
    window.removeEventListener("keydown", preventKeyPress, true);
    // Ou, se houver outro código para o teclado virtual, reative-o aqui
}


function resetCellHighlights(cells, attempt) {
    const wordLength = window.word.length;
    // Reseta as classes de destaque de todas as células da tentativa atual
    for (let i = 0; i < wordLength; i++) {
        const cell = cells[attempt * wordLength + i];
        cell.classList.remove("correct", "present", "absent");
    }
}

// Função para mostrar o "toaster"
function showToaster(message) {
    const toaster = document.createElement("div");
    toaster.classList.add("toaster");
    toaster.textContent = message;
    document.body.appendChild(toaster);

    setTimeout(() => {
        toaster.classList.add("show");
    }, 10);

    setTimeout(() => {
        toaster.classList.remove("show");
        setTimeout(() => {
            toaster.remove();
        }, 300);
    }, 3000);
}

// Função para aplicar a vibração à palavra
function showWordShake(guess) {
    const cells = document.querySelectorAll(".cell");
    const wordLength = window.word.length;
    let shakeCells = [];

    // Adicionando a classe shake nas células que têm a palavra errada
    for (let i = 0; i < wordLength; i++) {
        const cell = cells[window.currentAttempt * wordLength + i];
        if (cell.textContent !== window.word[i]) {
            cell.classList.add("shake");
            shakeCells.push(cell); // Armazenando as células para remover a animação após o tempo
        }
    }

    // Removendo a animação após a execução
    setTimeout(() => {
        shakeCells.forEach(cell => cell.classList.remove("shake"));
    }, 500); // Tempo de duração da animação
}


class SudokuGame {
  constructor() {
    this.board = Array(9)
      .fill()
      .map(() => Array(9).fill(0))
    this.solution = Array(9)
      .fill()
      .map(() => Array(9).fill(0))
    this.initialBoard = Array(9)
      .fill()
      .map(() => Array(9).fill(0))
    this.timer = 0
    this.timerInterval = null
    this.hintsUsed = 0
    this.maxHints = 3
    this.difficulty = "medium"
    this.gameStarted = false

    this.difficultySettings = {
      easy: { cellsToRemove: 40 },
      medium: { cellsToRemove: 50 },
      hard: { cellsToRemove: 60 },
    }

    this.init()
  }

  init() {
    this.createBoard()
    this.bindEvents()
    this.loadStats()
    this.updateStatsDisplay()
    this.generateNewPuzzle()
    this.loadTheme()
  }

  createBoard() {
    const boardElement = document.getElementById("sudokuBoard")
    boardElement.innerHTML = ""

    for (let i = 0; i < 81; i++) {
      const cell = document.createElement("input")
      cell.type = "text"
      cell.className = "cell"
      cell.maxLength = 1
      cell.dataset.index = i

      // Add event listeners
      cell.addEventListener("input", (e) => this.handleCellInput(e))
      cell.addEventListener("keydown", (e) => this.handleKeyNavigation(e))
      cell.addEventListener("focus", (e) => this.highlightRelated(e))
      cell.addEventListener("blur", (e) => this.removeHighlight(e))

      boardElement.appendChild(cell)
    }
  }

  bindEvents() {
    document.getElementById("newGame").addEventListener("click", () => this.generateNewPuzzle())
    document.getElementById("resetGame").addEventListener("click", () => this.showResetModal())
    document.getElementById("checkSolution").addEventListener("click", () => this.checkSolution())
    document.getElementById("getHint").addEventListener("click", () => this.giveHint())
    document.getElementById("difficulty").addEventListener("change", (e) => this.changeDifficulty(e.target.value))
    document.getElementById("themeToggle").addEventListener("click", () => this.toggleTheme())
    document.getElementById("resetStats").addEventListener("click", () => this.resetStats())

    // Modal events
    document.getElementById("confirmReset").addEventListener("click", () => this.resetGame())
    document.getElementById("cancelReset").addEventListener("click", () => this.hideResetModal())

    // Close modal on outside click
    document.getElementById("resetModal").addEventListener("click", (e) => {
      if (e.target.id === "resetModal") this.hideResetModal()
    })
  }

  generateNewPuzzle() {
    this.stopTimer()
    this.resetTimer()
    this.hintsUsed = 0
    this.updateHintsDisplay()
    this.gameStarted = false

    // Generate a complete valid solution
    this.board = Array(9)
      .fill()
      .map(() => Array(9).fill(0))
    this.fillBoard(this.board)
    this.solution = this.board.map((row) => [...row])

    // Remove cells based on difficulty
    const cellsToRemove = this.difficultySettings[this.difficulty].cellsToRemove
    this.removeCells(cellsToRemove)

    // Store initial state
    this.initialBoard = this.board.map((row) => [...row])

    this.renderBoard()
    this.showMessage("New puzzle generated! Good luck!", "info")
  }

  fillBoard(board) {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9]

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) {
          // Shuffle numbers for randomness
          const shuffledNumbers = [...numbers].sort(() => Math.random() - 0.5)

          for (const num of shuffledNumbers) {
            if (this.isValidMove(board, row, col, num)) {
              board[row][col] = num

              if (this.fillBoard(board)) {
                return true
              }

              board[row][col] = 0
            }
          }
          return false
        }
      }
    }
    return true
  }

  removeCells(count) {
    let removed = 0
    const cells = []

    // Create array of all cell positions
    for (let i = 0; i < 81; i++) {
      cells.push(i)
    }

    // Shuffle the cells array
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[cells[i], cells[j]] = [cells[j], cells[i]]
    }

    // Remove cells while ensuring unique solution
    for (let i = 0; i < cells.length && removed < count; i++) {
      const cellIndex = cells[i]
      const row = Math.floor(cellIndex / 9)
      const col = cellIndex % 9

      const backup = this.board[row][col]
      this.board[row][col] = 0

      // Check if puzzle still has unique solution
      if (this.hasUniqueSolution()) {
        removed++
      } else {
        this.board[row][col] = backup
      }
    }
  }

  hasUniqueSolution() {
    const testBoard = this.board.map((row) => [...row])
    let solutionCount = 0

    const solve = (board) => {
      if (solutionCount > 1) return false

      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (board[row][col] === 0) {
            for (let num = 1; num <= 9; num++) {
              if (this.isValidMove(board, row, col, num)) {
                board[row][col] = num

                if (solve(board)) {
                  solutionCount++
                  if (solutionCount > 1) {
                    board[row][col] = 0
                    return false
                  }
                }

                board[row][col] = 0
              }
            }
            return false
          }
        }
      }
      return true
    }

    solve(testBoard)
    return solutionCount === 1
  }

  isValidMove(board, row, col, num) {
    // Check row
    for (let x = 0; x < 9; x++) {
      if (board[row][x] === num) return false
    }

    // Check column
    for (let x = 0; x < 9; x++) {
      if (board[x][col] === num) return false
    }

    // Check 3x3 box
    const startRow = row - (row % 3)
    const startCol = col - (col % 3)

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[i + startRow][j + startCol] === num) return false
      }
    }

    return true
  }

  renderBoard() {
    const cells = document.querySelectorAll(".cell")

    cells.forEach((cell, index) => {
      const row = Math.floor(index / 9)
      const col = index % 9
      const value = this.board[row][col]

      cell.value = value === 0 ? "" : value
      cell.classList.remove("prefilled", "invalid", "hint")

      if (this.initialBoard[row][col] !== 0) {
        cell.classList.add("prefilled")
        cell.readOnly = true
      } else {
        cell.readOnly = false
      }
    })
  }

  handleCellInput(e) {
    const input = e.target.value
    const index = Number.parseInt(e.target.dataset.index)
    const row = Math.floor(index / 9)
    const col = index % 9

    // Start timer on first input
    if (!this.gameStarted && input) {
      this.startTimer()
      this.gameStarted = true
    }

    // Validate input
    if (input && !/^[1-9]$/.test(input)) {
      e.target.value = ""
      return
    }

    const num = input ? Number.parseInt(input) : 0
    this.board[row][col] = num

    // Clear previous styling
    e.target.classList.remove("invalid")

    // Validate move
    if (num !== 0) {
      // Temporarily remove the number to check validity
      this.board[row][col] = 0
      const isValid = this.isValidMove(this.board, row, col, num)
      this.board[row][col] = num

      if (!isValid) {
        e.target.classList.add("invalid")
        this.showMessage("Invalid move! Number already exists in row, column, or box.", "error")
      }
    }

    // Check if puzzle is solved
    if (this.isPuzzleComplete()) {
      this.checkSolution()
    }
  }

  handleKeyNavigation(e) {
    const index = Number.parseInt(e.target.dataset.index)
    const row = Math.floor(index / 9)
    const col = index % 9
    let newIndex = index

    switch (e.key) {
      case "ArrowUp":
        if (row > 0) newIndex = (row - 1) * 9 + col
        break
      case "ArrowDown":
        if (row < 8) newIndex = (row + 1) * 9 + col
        break
      case "ArrowLeft":
        if (col > 0) newIndex = row * 9 + (col - 1)
        break
      case "ArrowRight":
        if (col < 8) newIndex = row * 9 + (col + 1)
        break
      default:
        return
    }

    e.preventDefault()
    document.querySelector(`[data-index="${newIndex}"]`).focus()
  }

  highlightRelated(e) {
    const index = Number.parseInt(e.target.dataset.index)
    const row = Math.floor(index / 9)
    const col = index % 9

    document.querySelectorAll(".cell").forEach((cell, i) => {
      const cellRow = Math.floor(i / 9)
      const cellCol = i % 9

      // Highlight same row, column, or 3x3 box
      if (
        cellRow === row ||
        cellCol === col ||
        (Math.floor(cellRow / 3) === Math.floor(row / 3) && Math.floor(cellCol / 3) === Math.floor(col / 3))
      ) {
        cell.style.backgroundColor = "rgba(59, 130, 246, 0.1)"
      }
    })
  }

  removeHighlight(e) {
    document.querySelectorAll(".cell").forEach((cell) => {
      if (
        !cell.classList.contains("prefilled") &&
        !cell.classList.contains("invalid") &&
        !cell.classList.contains("hint")
      ) {
        cell.style.backgroundColor = ""
      }
    })
  }

  checkSolution() {
    if (!this.isPuzzleComplete()) {
      this.showMessage("Puzzle is not complete yet!", "error")
      return
    }

    if (this.isValidSolution()) {
      this.stopTimer()
      this.puzzleSolved()
    } else {
      this.showMessage("Solution is incorrect. Keep trying!", "error")
    }
  }

  isPuzzleComplete() {
    return this.board.every((row) => row.every((cell) => cell !== 0))
  }

  isValidSolution() {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const num = this.board[row][col]
        if (num === 0) return false

        // Temporarily remove the number to check validity
        this.board[row][col] = 0
        const isValid = this.isValidMove(this.board, row, col, num)
        this.board[row][col] = num

        if (!isValid) return false
      }
    }
    return true
  }

  puzzleSolved() {
    const timeInSeconds = this.timer
    this.updateStats(timeInSeconds)
    this.showMessage(`🎉 Congratulations! Puzzle solved in ${this.formatTime(timeInSeconds)}!`, "success")

    // Animate completion
    document.querySelectorAll(".cell").forEach((cell, index) => {
      setTimeout(() => {
        cell.style.animation = "pulse 0.5s ease-in-out"
      }, index * 20)
    })
  }

  giveHint() {
    if (this.hintsUsed >= this.maxHints) {
      this.showMessage("No more hints available!", "error")
      return
    }

    const emptyCells = []
    for (let i = 0; i < 81; i++) {
      const row = Math.floor(i / 9)
      const col = i % 9
      if (this.board[row][col] === 0) {
        emptyCells.push({ row, col, index: i })
      }
    }

    if (emptyCells.length === 0) return

    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)]
    const correctValue = this.solution[randomCell.row][randomCell.col]

    this.board[randomCell.row][randomCell.col] = correctValue
    const cellElement = document.querySelector(`[data-index="${randomCell.index}"]`)
    cellElement.value = correctValue
    cellElement.classList.add("hint")
    cellElement.readOnly = true

    this.hintsUsed++
    this.updateHintsDisplay()
    this.showMessage("Hint provided!", "info")
  }

  updateHintsDisplay() {
    document.getElementById("hintsLeft").textContent = this.maxHints - this.hintsUsed
  }

  changeDifficulty(newDifficulty) {
    this.difficulty = newDifficulty
    document.getElementById("currentDifficulty").textContent =
      newDifficulty.charAt(0).toUpperCase() + newDifficulty.slice(1)
    this.generateNewPuzzle()
  }

  showResetModal() {
    document.getElementById("resetModal").style.display = "block"
  }

  hideResetModal() {
    document.getElementById("resetModal").style.display = "none"
  }

  resetGame() {
    this.hideResetModal()
    this.board = this.initialBoard.map((row) => [...row])
    this.renderBoard()
    this.resetTimer()
    this.hintsUsed = 0
    this.updateHintsDisplay()
    this.gameStarted = false
    this.showMessage("Game reset!", "info")
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      this.timer++
      document.getElementById("timer").textContent = this.formatTime(this.timer)
    }, 1000)
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
      this.timerInterval = null
    }
  }

  resetTimer() {
    this.stopTimer()
    this.timer = 0
    document.getElementById("timer").textContent = "00:00"
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  updateStats(timeInSeconds) {
    const stats = this.getStats()
    stats.puzzlesSolved++
    stats.totalTime += timeInSeconds

    if (!stats.bestTime || timeInSeconds < stats.bestTime) {
      stats.bestTime = timeInSeconds
    }

    this.saveStats(stats)
    this.updateStatsDisplay()
  }

  getStats() {
    const defaultStats = {
      puzzlesSolved: 0,
      bestTime: null,
      totalTime: 0,
    }

    try {
      return JSON.parse(localStorage.getItem("sudokuStats")) || defaultStats
    } catch {
      return defaultStats
    }
  }

  saveStats(stats) {
    localStorage.setItem("sudokuStats", JSON.stringify(stats))
  }

  loadStats() {
    this.stats = this.getStats()
  }

  updateStatsDisplay() {
    const stats = this.getStats()

    document.getElementById("puzzlesSolved").textContent = stats.puzzlesSolved
    document.getElementById("bestTime").textContent = stats.bestTime ? this.formatTime(stats.bestTime) : "--:--"
    document.getElementById("totalTime").textContent = this.formatTime(stats.totalTime)

    const averageTime = stats.puzzlesSolved > 0 ? Math.floor(stats.totalTime / stats.puzzlesSolved) : 0
    document.getElementById("averageTime").textContent =
      stats.puzzlesSolved > 0 ? this.formatTime(averageTime) : "--:--"
  }

  resetStats() {
    if (confirm("Are you sure you want to reset all statistics?")) {
      localStorage.removeItem("sudokuStats")
      this.updateStatsDisplay()
      this.showMessage("Statistics reset!", "info")
    }
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme")
    const newTheme = currentTheme === "dark" ? "light" : "dark"

    document.documentElement.setAttribute("data-theme", newTheme)
    document.getElementById("themeToggle").textContent = newTheme === "dark" ? "☀️" : "🌙"

    localStorage.setItem("sudokuTheme", newTheme)
  }

  loadTheme() {
    const savedTheme = localStorage.getItem("sudokuTheme") || "light"
    document.documentElement.setAttribute("data-theme", savedTheme)
    document.getElementById("themeToggle").textContent = savedTheme === "dark" ? "☀️" : "🌙"
  }

  showMessage(text, type) {
    const messageContainer = document.getElementById("messageContainer")
    const message = document.createElement("div")
    message.className = `message ${type}`
    message.textContent = text

    messageContainer.appendChild(message)

    setTimeout(() => {
      message.remove()
    }, 4000)
  }
}

// Initialize the game when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new SudokuGame()
})

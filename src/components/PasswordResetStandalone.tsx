// Función auxiliar para generar el HTML completo de la página de restablecimiento
export function generatePasswordResetHTML(email: string, token: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restablecer Contraseña - Edwins Barber</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: #000000;
      color: #FFFFFF;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }

    .container {
      width: 100%;
      max-width: 32rem;
    }

    .header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .logo {
      width: 5rem;
      height: 5rem;
      background: linear-gradient(135deg, #E3931C, #F5A642);
      border-radius: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1rem;
      box-shadow: rgba(0, 0, 0, 0.7) 0px 8px 24px;
    }

    .logo::before {
      content: '✂️';
      font-size: 2.5rem;
    }

    .title {
      font-size: 1.875rem;
      font-weight: 700;
      color: #FFFFFF;
      margin-bottom: 0.5rem;
    }

    .subtitle {
      color: #aaaaaa;
      font-size: 0.875rem;
    }

    .card {
      background: #1a1a1a;
      border: 1px solid #3a3a3a;
      border-radius: 0.75rem;
      padding: 1.5rem;
      box-shadow: rgba(0, 0, 0, 0.5) 0px 4px 12px;
      margin-bottom: 1.5rem;
    }

    .details h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #FFFFFF;
      margin-bottom: 1rem;
    }

    .details-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
    }

    .detail-label {
      color: #aaaaaa;
    }

    .detail-value {
      color: #FFFFFF;
      font-family: 'Monaco', 'Menlo', monospace;
    }

    .form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .timer-info {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem;
      border-radius: 0.5rem;
      background: rgba(227, 147, 28, 0.1);
      border: 1px solid rgba(227, 147, 28, 0.2);
      color: #E3931C;
      font-size: 0.875rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-label {
      font-weight: 500;
      color: #FFFFFF;
      font-size: 0.875rem;
    }

    .input-container {
      position: relative;
    }

    .form-input {
      width: 100%;
      background: #2a2a2a;
      border: 1px solid #3a3a3a;
      color: #FFFFFF;
      border-radius: 0.5rem;
      padding: 0.75rem;
      font-size: 0.875rem;
      padding-right: 2.5rem;
    }

    .form-input:focus {
      outline: none;
      border-color: #E3931C;
      box-shadow: 0 0 0 1px #E3931C;
    }

    .form-input::placeholder {
      color: #6a6a6a;
    }

    .toggle-btn {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #6a6a6a;
      cursor: pointer;
      font-size: 1rem;
      padding: 0.25rem;
    }

    .toggle-btn:hover {
      color: #FFFFFF;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
      border-radius: 0.5rem;
      background: rgba(127, 29, 29, 0.2);
      border: 1px solid rgba(220, 38, 38, 0.3);
      color: #f87171;
      font-size: 0.875rem;
    }

    .validation-info {
      margin-top: 0.75rem;
      padding: 0.75rem;
      background: #2a2a2a;
      border: 1px solid #3a3a3a;
      border-radius: 0.5rem;
    }

    .validation-title {
      color: #FFFFFF;
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
    }

    .validation-list {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .validation-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
    }

    .validation-dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
    }

    .validation-valid {
      color: #4ade80;
    }

    .validation-valid .validation-dot {
      background: #4ade80;
    }

    .validation-invalid {
      color: #aaaaaa;
    }

    .validation-invalid .validation-dot {
      background: #4a4a4a;
    }

    .mismatch-error {
      color: #f87171;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .submit-section {
      padding-top: 1rem;
      border-top: 1px solid #3a3a3a;
    }

    .submit-btn {
      width: 100%;
      background: #E3931C;
      color: #000000;
      border: none;
      border-radius: 0.75rem;
      padding: 0.75rem 1.5rem;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .submit-btn:hover {
      background: #F5A642;
    }

    .submit-btn:disabled {
      background: #4a4a4a;
      color: #6a6a6a;
      cursor: not-allowed;
    }

    .spinner {
      width: 1rem;
      height: 1rem;
      border: 2px solid #000000;
      border-top: 2px solid transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .back-section {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #3a3a3a;
      text-align: center;
    }

    .back-btn {
      background: none;
      border: none;
      color: #E3931C;
      font-size: 0.875rem;
      cursor: pointer;
      transition: color 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .back-btn:hover {
      color: #F5A642;
    }

    .security-info {
      margin-top: 1.5rem;
      padding: 1rem;
      background: rgba(227, 147, 28, 0.05);
      border: 1px solid rgba(227, 147, 28, 0.2);
      border-radius: 0.5rem;
    }

    .security-header {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .security-icon {
      color: #E3931C;
      font-size: 1.25rem;
      margin-top: 0.125rem;
    }

    .security-content h4 {
      font-weight: 500;
      color: #FFFFFF;
      margin-bottom: 0.5rem;
    }

    .security-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .security-list li {
      color: #aaaaaa;
      font-size: 0.875rem;
    }

    .success-page {
      text-align: center;
    }

    .success-icon {
      width: 5rem;
      height: 5rem;
      background: rgba(22, 163, 74, 0.2);
      border-radius: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
    }

    .success-icon::before {
      content: '✅';
      font-size: 2.5rem;
    }

    .success-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #FFFFFF;
      margin-bottom: 1rem;
    }

    .success-text {
      color: #aaaaaa;
      margin-bottom: 1.5rem;
    }

    .btn-group {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .btn-secondary {
      width: 100%;
      background: transparent;
      color: #E3931C;
      border: 1px solid #E3931C;
      border-radius: 0.75rem;
      padding: 0.75rem 1.5rem;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-secondary:hover {
      background: rgba(227, 147, 28, 0.1);
      color: #F5A642;
    }

    .hidden {
      display: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Paso de verificación -->
    <div id="verify-step">
      <div class="card">
        <div class="header">
          <div class="logo"></div>
          <h1 class="title">Verificando enlace...</h1>
          <p class="subtitle">Estamos validando tu enlace de recuperación de contraseña</p>
        </div>
        <div style="text-align: center;">
          <div class="spinner"></div>
        </div>
      </div>
    </div>

    <!-- Paso principal -->
    <div id="reset-step" class="hidden">
      <div class="header">
        <div class="logo"></div>
        <h1 class="title">Recuperación de Contraseña</h1>
        <p class="subtitle">Hemos recibido una solicitud para restablecer la contraseña de tu cuenta</p>
      </div>

      <div class="card details">
        <h3>Detalles de la solicitud:</h3>
        <div class="details-list">
          <div class="detail-row">
            <span class="detail-label">Cuenta:</span>
            <span class="detail-value">${email}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Fecha:</span>
            <span class="detail-value">${new Date().toLocaleString('es-ES')}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">IP:</span>
            <span class="detail-value">192.168.1.100 (Simulado)</span>
          </div>
        </div>
      </div>

      <div class="card">
        <form class="form" id="resetForm">
          <div id="error-container" class="hidden">
            <div class="error-message">
              <span>⚠️</span>
              <span id="error-text"></span>
            </div>
          </div>

          <div class="timer-info">
            <span>🕒</span>
            <span>Este enlace es válido por: <span id="timer">24:00:00</span></span>
          </div>

          <div class="form-group">
            <label class="form-label">Nueva contraseña</label>
            <div class="input-container">
              <input 
                type="password" 
                id="newPassword" 
                class="form-input" 
                placeholder="Mínimo 6 caracteres" 
                required
              >
              <button type="button" class="toggle-btn" id="toggleNewPassword">👁️</button>
            </div>
            <div id="validation-info" class="validation-info hidden">
              <div class="validation-title">Requisitos de seguridad:</div>
              <div class="validation-list">
                <div class="validation-item validation-invalid" id="length-validation">
                  <div class="validation-dot"></div>
                  <span>Mínimo 6 caracteres</span>
                </div>
                <div class="validation-item validation-invalid" id="number-validation">
                  <div class="validation-dot"></div>
                  <span>Al menos un número (recomendado)</span>
                </div>
                <div class="validation-item validation-invalid" id="uppercase-validation">
                  <div class="validation-dot"></div>
                  <span>Al menos una mayúscula (recomendado)</span>
                </div>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Confirmar contraseña</label>
            <div class="input-container">
              <input 
                type="password" 
                id="confirmPassword" 
                class="form-input" 
                placeholder="Repite tu nueva contraseña" 
                required
              >
              <button type="button" class="toggle-btn" id="toggleConfirmPassword">👁️</button>
            </div>
            <div id="mismatch-error" class="mismatch-error hidden">Las contraseñas no coinciden</div>
          </div>

          <div class="submit-section">
            <button type="submit" class="submit-btn" id="submitBtn" disabled>
              <span>🛡️</span>
              <span>Restablecer Contraseña</span>
            </button>
          </div>
        </form>

        <div class="back-section">
          <button class="back-btn" onclick="window.close()">
            <span>←</span>
            <span>Cerrar ventana</span>
          </button>
        </div>
      </div>

      <div class="security-info">
        <div class="security-header">
          <div class="security-icon">🛡️</div>
          <div class="security-content">
            <h4>Información de Seguridad</h4>
            <ul class="security-list">
              <li>• Este enlace expira automáticamente para tu seguridad</li>
              <li>• Solo puede ser usado una vez</li>
              <li>• Tu nueva contraseña se aplicará inmediatamente</li>
              <li>• Cierra esta ventana después de completar el proceso</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Paso de éxito -->
    <div id="success-step" class="hidden">
      <div class="card success-page">
        <div class="success-icon"></div>
        <h1 class="success-title">¡Contraseña actualizada!</h1>
        <p class="success-text">Tu contraseña ha sido cambiada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.</p>
        <div class="btn-group">
          <button class="submit-btn" onclick="window.close()">Cerrar ventana</button>
          <button class="btn-secondary" onclick="if(window.opener) window.opener.location.reload()">Volver al login</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    let timeLeft = 24 * 60 * 60; // 24 horas en segundos
    let timerInterval;

    // Elementos del DOM
    const verifyStep = document.getElementById('verify-step');
    const resetStep = document.getElementById('reset-step');
    const successStep = document.getElementById('success-step');
    const form = document.getElementById('resetForm');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const toggleNewPassword = document.getElementById('toggleNewPassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const submitBtn = document.getElementById('submitBtn');
    const errorContainer = document.getElementById('error-container');
    const errorText = document.getElementById('error-text');
    const validationInfo = document.getElementById('validation-info');
    const mismatchError = document.getElementById('mismatch-error');
    const timer = document.getElementById('timer');

    // Función para formatear tiempo
    function formatTime(seconds) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      return \`\${hours.toString().padStart(2, '0')}:\${minutes.toString().padStart(2, '0')}:\${secs.toString().padStart(2, '0')}\`;
    }

    // Actualizar timer
    function updateTimer() {
      timer.textContent = formatTime(timeLeft);
      timeLeft--;
      if (timeLeft < 0) {
        clearInterval(timerInterval);
        showError('El enlace ha expirado');
        submitBtn.disabled = true;
      }
    }

    // Mostrar error
    function showError(message) {
      errorText.textContent = message;
      errorContainer.classList.remove('hidden');
    }

    // Ocultar error
    function hideError() {
      errorContainer.classList.add('hidden');
    }

    // Validar contraseña
    function validatePassword(password) {
      return {
        minLength: password.length >= 6,
        hasNumber: /[0-9]/.test(password),
        hasUpperCase: /[A-Z]/.test(password)
      };
    }

    // Actualizar validaciones
    function updateValidations() {
      const password = newPasswordInput.value;
      const validations = validatePassword(password);

      if (password) {
        validationInfo.classList.remove('hidden');
        
        const lengthValidation = document.getElementById('length-validation');
        const numberValidation = document.getElementById('number-validation');
        const uppercaseValidation = document.getElementById('uppercase-validation');

        // Actualizar validación de longitud
        if (validations.minLength) {
          lengthValidation.classList.remove('validation-invalid');
          lengthValidation.classList.add('validation-valid');
        } else {
          lengthValidation.classList.remove('validation-valid');
          lengthValidation.classList.add('validation-invalid');
        }

        // Actualizar validación de número
        if (validations.hasNumber) {
          numberValidation.classList.remove('validation-invalid');
          numberValidation.classList.add('validation-valid');
        } else {
          numberValidation.classList.remove('validation-valid');
          numberValidation.classList.add('validation-invalid');
        }

        // Actualizar validación de mayúscula
        if (validations.hasUpperCase) {
          uppercaseValidation.classList.remove('validation-invalid');
          uppercaseValidation.classList.add('validation-valid');
        } else {
          uppercaseValidation.classList.remove('validation-valid');
          uppercaseValidation.classList.add('validation-invalid');
        }
      } else {
        validationInfo.classList.add('hidden');
      }
    }

    // Validar coincidencia de contraseñas
    function validatePasswordMatch() {
      const password = newPasswordInput.value;
      const confirmPassword = confirmPasswordInput.value;

      if (confirmPassword && password !== confirmPassword) {
        mismatchError.classList.remove('hidden');
        return false;
      } else {
        mismatchError.classList.add('hidden');
        return true;
      }
    }

    // Verificar si el formulario es válido
    function checkFormValidity() {
      const password = newPasswordInput.value;
      const confirmPassword = confirmPasswordInput.value;
      const validations = validatePassword(password);
      const passwordsMatch = validatePasswordMatch();

      const isValid = validations.minLength && 
                     password === confirmPassword && 
                     passwordsMatch && 
                     password && 
                     confirmPassword;

      submitBtn.disabled = !isValid;
    }

    // Event listeners
    toggleNewPassword.addEventListener('click', () => {
      const type = newPasswordInput.type === 'password' ? 'text' : 'password';
      newPasswordInput.type = type;
      toggleNewPassword.textContent = type === 'password' ? '👁️' : '🙈';
    });

    toggleConfirmPassword.addEventListener('click', () => {
      const type = confirmPasswordInput.type === 'password' ? 'text' : 'password';
      confirmPasswordInput.type = type;
      toggleConfirmPassword.textContent = type === 'password' ? '👁️' : '🙈';
    });

    newPasswordInput.addEventListener('input', () => {
      hideError();
      updateValidations();
      checkFormValidity();
    });

    confirmPasswordInput.addEventListener('input', () => {
      hideError();
      validatePasswordMatch();
      checkFormValidity();
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const password = newPasswordInput.value;
      const confirmPassword = confirmPasswordInput.value;
      const validations = validatePassword(password);

      if (password !== confirmPassword) {
        showError('Las contraseñas no coinciden');
        return;
      }

      if (!validations.minLength) {
        showError('La contraseña debe tener al menos 6 caracteres');
        return;
      }

      // Mostrar loading
      submitBtn.innerHTML = '<div class="spinner"></div><span>Actualizando contraseña...</span>';
      submitBtn.disabled = true;

      // Simular proceso
      setTimeout(() => {
        verifyStep.classList.add('hidden');
        resetStep.classList.add('hidden');
        successStep.classList.remove('hidden');
      }, 2000);
    });

    // Inicializar
    setTimeout(() => {
      verifyStep.classList.add('hidden');
      resetStep.classList.remove('hidden');
      
      // Iniciar timer
      timerInterval = setInterval(updateTimer, 1000);
      updateTimer();
    }, 1000);
  </script>
</body>
</html>`;
}
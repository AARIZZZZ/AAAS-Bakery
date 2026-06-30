/**
 * ─────────────────────────────────────────────
 *  AAAS BAKERY — RAZORPAY PAYMENT
 * ─────────────────────────────────────────────
 *  SETUP STEPS:
 *  1. Go to https://razorpay.com and create a free account
 *  2. Complete KYC with your bank account details
 *  3. Get your KEY_ID from Dashboard → Settings → API Keys
 *  4. Paste it below in RAZORPAY_CONFIG.key
 *
 *  All payments go directly to the bank account
 *  linked to your Razorpay account (set during KYC).
 * ─────────────────────────────────────────────
 */

const RAZORPAY_CONFIG = {
  key: 'rzp_live_PASTE_YOUR_KEY_HERE',  /* ← REPLACE THIS */
  business_name: 'AAAS Bakery',
  description: 'Cake Order Advance Payment',
  logo: 'logo.png',                     /* ← your logo file */
  theme_color: '#e05088',
  contact_phone: '917XXXXXXXXX',        /* ← your WhatsApp number */
  contact_email: 'aaasbakery@gmail.com' /* ← your email */
};

function initiatePayment() {
  const amountInput = document.getElementById('payAmount');
  const nameInput   = document.getElementById('payName');
  const phoneInput  = document.getElementById('payPhone');
  const btn         = document.getElementById('payBtn');
  const btnText     = document.getElementById('payBtnText');

  const amount = parseFloat(amountInput?.value);
  const name   = nameInput?.value.trim();
  const phone  = phoneInput?.value.trim().replace(/\D/g, '');

  /* ── Validation ── */
  if (!amount || amount < 100) {
    showPayError('Please enter a valid amount (minimum ₹100)');
    amountInput?.focus();
    return;
  }
  if (!name) {
    showPayError('Please enter your name');
    nameInput?.focus();
    return;
  }
  if (!phone || phone.length < 10) {
    showPayError('Please enter a valid 10-digit phone number');
    phoneInput?.focus();
    return;
  }

  /* ── Loading state ── */
  if (btn) btn.disabled = true;
  if (btnText) btnText.textContent = 'Opening Payment...';

  const options = {
    key:         RAZORPAY_CONFIG.key,
    amount:      Math.round(amount * 100), /* Razorpay takes paise */
    currency:    'INR',
    name:        RAZORPAY_CONFIG.business_name,
    description: RAZORPAY_CONFIG.description,
    image:       RAZORPAY_CONFIG.logo,
    prefill: {
      name:    name,
      contact: phone,
      email:   RAZORPAY_CONFIG.contact_email
    },
    theme: {
      color: RAZORPAY_CONFIG.theme_color
    },
    handler: function (response) {
      /* ── Payment successful ── */
      showPaySuccess(response.razorpay_payment_id, amount, name);
    },
    modal: {
      ondismiss: function () {
        if (btn) btn.disabled = false;
        if (btnText) btnText.textContent = 'Pay Now with Razorpay';
      }
    }
  };

  try {
    const rzp = new Razorpay(options);
    rzp.on('payment.failed', function (response) {
      showPayError('Payment failed: ' + response.error.description);
      if (btn) btn.disabled = false;
      if (btnText) btnText.textContent = 'Pay Now with Razorpay';
    });
    rzp.open();
  } catch (e) {
    showPayError('Could not open payment. Make sure the Razorpay key is configured correctly.');
    console.error('Razorpay error:', e);
    if (btn) btn.disabled = false;
    if (btnText) btnText.textContent = 'Pay Now with Razorpay';
  }
}

function showPaySuccess(paymentId, amount, name) {
  const btn     = document.getElementById('payBtn');
  const btnText = document.getElementById('payBtnText');
  if (btn) btn.disabled = false;
  if (btnText) btnText.textContent = 'Pay Now with Razorpay';

  /* Replace payment card with success message */
  const card = document.querySelector('.pay-card');
  if (!card) return;

  card.innerHTML = `
    <div class="pay-success">
      <div class="pay-success-icon">✅</div>
      <h3 class="pay-success-title">Payment Received!</h3>
      <p class="pay-success-msg">Thank you <strong>${name}</strong>! Your ₹${amount.toLocaleString('en-IN')} advance has been received.</p>
      <div class="pay-success-id">Payment ID: <code>${paymentId}</code></div>
      <p class="pay-success-sub">We'll confirm your order on WhatsApp shortly. 🎂</p>
      <button class="pay-btn" style="margin-top:24px" onclick="location.reload()">Make Another Payment</button>
    </div>
  `;

  /* Scroll to success */
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showPayError(msg) {
  /* Remove any existing error */
  document.querySelectorAll('.pay-error-msg').forEach(e => e.remove());

  const err = document.createElement('div');
  err.className = 'pay-error-msg';
  err.textContent = '⚠️ ' + msg;

  const btn = document.getElementById('payBtn');
  if (btn) btn.insertAdjacentElement('beforebegin', err);

  setTimeout(() => err.remove(), 4000);
}

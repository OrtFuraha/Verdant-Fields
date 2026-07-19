// Verdant Fields - Main JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // Initialize tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });

  // Auto-hide alerts after 5 seconds
  const alerts = document.querySelectorAll('.alert');
  alerts.forEach(function(alert) {
    setTimeout(function() {
      alert.style.transition = 'opacity 0.5s ease';
      alert.style.opacity = '0';
      setTimeout(function() {
        alert.remove();
      }, 500);
    }, 5000);
  });

  // Mobile menu close on click
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
  const navbarCollapse = document.querySelector('.navbar-collapse');
  navLinks.forEach(function(link) {
    link.addEventListener('click', function() {
      if (navbarCollapse.classList.contains('show')) {
        navbarCollapse.classList.remove('show');
      }
    });
  });

  // Form validation
  const forms = document.querySelectorAll('form');
  forms.forEach(function(form) {
    form.addEventListener('submit', function(event) {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      form.classList.add('was-validated');
    });
  });
});

// Utility function to format currency
function formatCurrency(amount) {
  return '$' + parseFloat(amount).toFixed(2);
}

// Utility function to get cart count
function updateCartCount() {
  fetch('/api/cart/count')
    .then(response => response.json())
    .then(data => {
      const badge = document.querySelector('.cart-badge');
      if (badge) {
        badge.textContent = data.count;
        badge.style.display = data.count > 0 ? 'inline' : 'none';
      }
    })
    .catch(err => console.error('Error fetching cart count:', err));
}

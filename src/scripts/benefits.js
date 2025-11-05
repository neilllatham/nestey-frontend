// src/scripts/benefits.js

const API_BASE = "http://localhost:3001/api/benefits";

// Fetch benefits for an employee
async function getBenefits(employeeId) {
  const res = await fetch(`${API_BASE}?employee_id=${employeeId}`);
  if (!res.ok) throw new Error("Failed to fetch benefits");
  return res.json();
}

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
}

// Render a single benefit item
function renderBenefit(benefit) {
  // Only show plan name if it's different from benefit name
  const showPlanName = benefit.plan_name && benefit.plan_name !== benefit.benefit_name;
  
  return `
    <div class="benefit-item" style="padding: 1.25rem;">
      <div class="benefit-header" style="margin-bottom: 0.75rem;">
        <div>
          <div class="benefit-name" style="margin-bottom: 0.5rem; line-height: 1.3; font-size: 1rem; font-weight: 600;">${benefit.benefit_name}</div>
          ${showPlanName ? `<div class="benefit-plan" style="margin-top: 0.25rem;">${benefit.plan_name}</div>` : ''}
        </div>
        ${benefit.dependants > 0 ? `<span class="dependants-badge">${benefit.dependants} dependent${benefit.dependants > 1 ? 's' : ''}</span>` : ''}
      </div>
      
      ${benefit.description ? `<div class="benefit-description" style="margin-top: 0.5rem; margin-bottom: 0.75rem; line-height: 1.5; font-size: 0.95rem;">${benefit.description}</div>` : ''}
      
      <div class="benefit-costs" style="margin-top: 0.75rem; padding-top: 0.75rem; display: flex; gap: 1rem; flex-wrap: wrap;">
        <div class="kpi cost-item employee" style="flex: 1; min-width: 150px;">
          <span>I Pay</span>
          <span class="value">${formatCurrency(benefit.employee_pays)}</span>
        </div>
        <div class="kpi cost-item employer" style="flex: 1; min-width: 150px;">
          <span>Employer Pays</span>
          <span class="value">${formatCurrency(benefit.employer_pays)}</span>
        </div>
        <div class="kpi cost-item" style="flex: 1; min-width: 150px;">
          <span>Total Cost</span>
          <span class="value">${formatCurrency(benefit.total_plan_cost)}</span>
        </div>
      </div>
    </div>
  `;
}

// Load and display benefits
async function loadBenefits() {
  try {
    // TODO: Replace with actual employee ID from auth/session
    const employeeId = 2;
    const { benefits, byCategory, totals } = await getBenefits(employeeId);
    
    console.info('[benefits] Loaded benefits:', { benefits, byCategory, totals });

    // Update cost summary KPIs
    document.getElementById('kpi-employee-pays').textContent = formatCurrency(totals.total_employee_pays);
    document.getElementById('kpi-employer-pays').textContent = formatCurrency(totals.total_employer_pays);
    document.getElementById('kpi-total-cost').textContent = formatCurrency(totals.total_cost);

    // Render benefits by category
    const categories = {
      'Medical': 'medicalBenefits',
      'Dental': 'dentalBenefits',
      'Vision': 'visionBenefits',
      'Other': 'otherBenefits'
    };

    Object.entries(categories).forEach(([category, elementId]) => {
      const container = document.getElementById(elementId);
      const categoryBenefits = byCategory[category] || [];
      
      if (categoryBenefits.length === 0) {
        container.innerHTML = '<div class="benefit-placeholder">No benefits enrolled</div>';
      } else {
        container.innerHTML = categoryBenefits.map(renderBenefit).join('');
      }
    });

  } catch (err) {
    console.error('Failed to load benefits:', err);
    // Show error in all containers
    ['medicalBenefits', 'dentalBenefits', 'visionBenefits', 'otherBenefits'].forEach(id => {
      const container = document.getElementById(id);
      if (container) {
        container.innerHTML = '<div class="benefit-placeholder">Error loading benefits</div>';
      }
    });
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadBenefits);

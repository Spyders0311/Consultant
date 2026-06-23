export const FORM_DOCUMENT_CONFIGS = {
  'hotel-of-record-form': {
    title: 'HOTEL of RECORD FORM',
    formType: 'hotel',
    fields: [
      { name: 'hotelName', label: 'Hotel Name', type: 'text' },
      { name: 'checkIn', label: 'Check-in Date', type: 'date' },
      { name: 'checkOut', label: 'Check-out Date', type: 'date' },
      { name: 'confirmationNumber', label: 'Confirmation #', type: 'text' },
      { name: 'nightlyRate', label: 'Nightly Rate', type: 'number' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  'initial-consultation-invoice': {
    title: 'INITIAL CONSULTATION INVOICE',
    formType: 'invoice',
    invoiceType: 'consultation',
    fields: [
      { name: 'invoiceDate', label: 'Invoice Date', type: 'date' },
      { name: 'serviceDescription', label: 'Service Description', type: 'text' },
      { name: 'hours', label: 'Hours', type: 'number' },
      { name: 'rate', label: 'Hourly Rate', type: 'number' },
      { name: 'amount', label: 'Amount', type: 'number' },
    ],
  },
  'ps-retainer-invoice': {
    title: 'PS Retainer Invoice',
    formType: 'invoice',
    invoiceType: 'retainer',
    fields: [
      { name: 'invoiceDate', label: 'Invoice Date', type: 'date' },
      { name: 'retainerPeriod', label: 'Retainer Period', type: 'text' },
      { name: 'retainerAmount', label: 'Retainer Amount', type: 'number' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
};

export const CLIENT_GOALS_CONFIGS = {
  'client-business-goals': {
    title: 'CLIENT BUSINESS GOALS',
    goalType: 'business',
    fields: [
      { name: 'revenueTarget', label: 'Revenue Target', type: 'textarea' },
      { name: 'marginTarget', label: 'Margin Target', type: 'textarea' },
      { name: 'growthInitiatives', label: 'Growth Initiatives', type: 'textarea' },
      { name: 'operationalPriorities', label: 'Operational Priorities', type: 'textarea' },
    ],
  },
  'client-personal-goals': {
    title: 'CLIENT PERSONAL GOALS',
    goalType: 'personal',
    fields: [
      { name: 'ownerObjectives', label: 'Owner Objectives', type: 'textarea' },
      { name: 'successionPlans', label: 'Succession Plans', type: 'textarea' },
      { name: 'lifestyleGoals', label: 'Lifestyle Goals', type: 'textarea' },
      { name: 'timeline', label: 'Timeline', type: 'textarea' },
    ],
  },
};

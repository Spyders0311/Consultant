export const ROI_ANALYSIS_CONFIGS = {
  'return-on-investment-labor': {
    title: 'Return on Investment - LABOR',
    roiType: 'labor',
    feederAnalysisType: 'direct_labor',
  },
  'return-on-investment-c-o-g-s': {
    title: 'Return on Investment - C.O.G.S.',
    roiType: 'cogs',
    usePlCogs: true,
  },
  'return-on-investment-material': {
    title: 'Return on Investment - MATERIAL',
    roiType: 'material',
    feederAnalysisType: 'material',
  },
  'return-on-investment-sub-cont': {
    title: 'Return on Investment - SUB-CONT',
    roiType: 'subcontract',
    feederAnalysisType: 'payroll',
    feederCategory: 'contractors',
  },
  'r-o-i-misc-direct': {
    title: 'R O I - MISC DIRECT',
    roiType: 'misc-direct',
    miscDirect: true,
  },
};

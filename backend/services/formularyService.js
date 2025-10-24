class FormularyService {
  constructor() {
    // Mock formulary database - in production, this would connect to a real formulary API
    this.formulary = [
      {
        genericName: 'Amoxicillin',
        brands: ['Amoxil', 'Trimox', 'Moxatag'],
        category: 'Antibiotic',
        dosageForms: ['250mg capsule', '500mg capsule', '125mg/5ml suspension'],
        indications: ['Bacterial infections', 'Respiratory tract infections'],
        contraindications: ['Penicillin allergy'],
        interactions: ['Warfarin', 'Methotrexate']
      },
      {
        genericName: 'Metformin',
        brands: ['Glucophage', 'Fortamet', 'Glumetza'],
        category: 'Antidiabetic',
        dosageForms: ['500mg tablet', '850mg tablet', '1000mg tablet'],
        indications: ['Type 2 diabetes'],
        contraindications: ['Kidney disease', 'Liver disease'],
        interactions: ['Alcohol', 'Contrast dye']
      },
      {
        genericName: 'Lisinopril',
        brands: ['Prinivil', 'Zestril'],
        category: 'ACE Inhibitor',
        dosageForms: ['5mg tablet', '10mg tablet', '20mg tablet'],
        indications: ['Hypertension', 'Heart failure'],
        contraindications: ['Pregnancy', 'Angioedema history'],
        interactions: ['Potassium supplements', 'NSAIDs']
      },
      {
        genericName: 'Omeprazole',
        brands: ['Prilosec', 'Losec'],
        category: 'Proton Pump Inhibitor',
        dosageForms: ['20mg capsule', '40mg capsule'],
        indications: ['GERD', 'Peptic ulcer'],
        contraindications: ['Hypersensitivity'],
        interactions: ['Warfarin', 'Clopidogrel']
      },
      {
        genericName: 'Atorvastatin',
        brands: ['Lipitor'],
        category: 'Statin',
        dosageForms: ['10mg tablet', '20mg tablet', '40mg tablet', '80mg tablet'],
        indications: ['High cholesterol', 'Cardiovascular prevention'],
        contraindications: ['Liver disease', 'Pregnancy'],
        interactions: ['Grapefruit juice', 'Cyclosporine']
      }
    ];
  }

  searchFormulary(query) {
    const searchTerm = query.toLowerCase();
    return this.formulary.filter(drug => 
      drug.genericName.toLowerCase().includes(searchTerm) ||
      drug.brands.some(brand => brand.toLowerCase().includes(searchTerm)) ||
      drug.category.toLowerCase().includes(searchTerm) ||
      drug.indications.some(indication => indication.toLowerCase().includes(searchTerm))
    );
  }

  getDrugInfo(genericName) {
    return this.formulary.find(drug => 
      drug.genericName.toLowerCase() === genericName.toLowerCase()
    );
  }

  getBrandOptions(genericName) {
    const drug = this.getDrugInfo(genericName);
    return drug ? drug.brands : [];
  }

  checkDrugInteractions(drugList) {
    const interactions = [];
    
    for (let i = 0; i < drugList.length; i++) {
      for (let j = i + 1; j < drugList.length; j++) {
        const drug1 = this.getDrugInfo(drugList[i]);
        const drug2 = this.getDrugInfo(drugList[j]);
        
        if (drug1 && drug2) {
          // Check if drug1 interacts with drug2
          if (drug1.interactions.includes(drug2.genericName) || 
              drug2.interactions.includes(drug1.genericName)) {
            interactions.push({
              drug1: drug1.genericName,
              drug2: drug2.genericName,
              severity: 'moderate',
              description: `Potential interaction between ${drug1.genericName} and ${drug2.genericName}`
            });
          }
        }
      }
    }
    
    return interactions;
  }

  validatePrescription(prescription) {
    const errors = [];
    const warnings = [];
    
    // Check if drug exists in formulary
    const drugInfo = this.getDrugInfo(prescription.genericName);
    if (!drugInfo) {
      errors.push(`${prescription.genericName} not found in formulary`);
      return { valid: false, errors, warnings };
    }
    
    // Check dosage form
    if (!drugInfo.dosageForms.includes(prescription.dosageForm)) {
      warnings.push(`${prescription.dosageForm} may not be available for ${prescription.genericName}`);
    }
    
    // Check contraindications (would need patient data)
    if (prescription.patientAllergies) {
      const allergyCheck = this.checkAllergies(drugInfo, prescription.patientAllergies);
      if (allergyCheck.length > 0) {
        errors.push(...allergyCheck);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      drugInfo
    };
  }

  checkAllergies(drugInfo, patientAllergies) {
    const allergies = [];
    
    // Simple allergy checking - in production, this would be more sophisticated
    patientAllergies.forEach(allergy => {
      if (drugInfo.contraindications.some(contra => 
          contra.toLowerCase().includes(allergy.toLowerCase()))) {
        allergies.push(`Patient allergic to ${allergy} - contraindicated with ${drugInfo.genericName}`);
      }
    });
    
    return allergies;
  }

  getAlternatives(genericName, reason = 'general') {
    const drug = this.getDrugInfo(genericName);
    if (!drug) return [];
    
    // Find drugs in same category
    return this.formulary.filter(d => 
      d.category === drug.category && 
      d.genericName !== genericName
    ).map(d => ({
      genericName: d.genericName,
      brands: d.brands,
      reason: `Alternative ${drug.category.toLowerCase()}`
    }));
  }
}

module.exports = new FormularyService();
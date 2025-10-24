// Simple Drug Information Service
class DrugInformationService {
  
  // Simple drug database with common medications
  static drugDatabase = {
    'warfarin': {
      name: 'Warfarin',
      category: 'Anticoagulant',
      description: 'Blood thinner used to prevent blood clots',
      sideEffects: ['Bleeding', 'Bruising', 'Nausea', 'Hair loss'],
      contraindications: ['Pregnancy', 'Active bleeding', 'Severe liver disease'],
      foodInteractions: [
        { food: 'Vitamin K rich foods (spinach, kale)', effect: 'Reduces effectiveness', severity: 'moderate' },
        { food: 'Alcohol', effect: 'Increases bleeding risk', severity: 'high' },
        { food: 'Cranberry juice', effect: 'Increases bleeding risk', severity: 'moderate' }
      ],
      drugInteractions: [
        { drug: 'aspirin', effect: 'Increased bleeding risk', severity: 'high' },
        { drug: 'ibuprofen', effect: 'Increased bleeding risk', severity: 'moderate' },
        { drug: 'amoxicillin', effect: 'May increase warfarin effect', severity: 'moderate' }
      ]
    },
    'aspirin': {
      name: 'Aspirin',
      category: 'NSAID/Antiplatelet',
      description: 'Pain reliever and blood thinner',
      sideEffects: ['Stomach upset', 'Bleeding', 'Ringing in ears', 'Allergic reactions'],
      contraindications: ['Peptic ulcer', 'Bleeding disorders', 'Children with viral infections'],
      foodInteractions: [
        { food: 'Alcohol', effect: 'Increases stomach bleeding risk', severity: 'high' },
        { food: 'Ginger', effect: 'May increase bleeding risk', severity: 'low' }
      ],
      drugInteractions: [
        { drug: 'warfarin', effect: 'Increased bleeding risk', severity: 'high' },
        { drug: 'metformin', effect: 'May increase metformin levels', severity: 'moderate' },
        { drug: 'lisinopril', effect: 'May reduce blood pressure effect', severity: 'moderate' }
      ]
    },
    'metformin': {
      name: 'Metformin',
      category: 'Antidiabetic',
      description: 'Medication for type 2 diabetes',
      sideEffects: ['Nausea', 'Diarrhea', 'Metallic taste', 'Vitamin B12 deficiency'],
      contraindications: ['Kidney disease', 'Liver disease', 'Heart failure'],
      foodInteractions: [
        { food: 'Alcohol', effect: 'Increases risk of lactic acidosis', severity: 'high' },
        { food: 'High fiber foods', effect: 'May reduce absorption', severity: 'low' }
      ],
      drugInteractions: [
        { drug: 'furosemide', effect: 'May increase metformin levels', severity: 'moderate' },
        { drug: 'prednisone', effect: 'May increase blood sugar', severity: 'moderate' }
      ]
    },
    'lisinopril': {
      name: 'Lisinopril',
      category: 'ACE Inhibitor',
      description: 'Blood pressure medication',
      sideEffects: ['Dry cough', 'Dizziness', 'Fatigue', 'High potassium'],
      contraindications: ['Pregnancy', 'Angioedema history', 'Bilateral renal artery stenosis'],
      foodInteractions: [
        { food: 'Salt substitutes (potassium)', effect: 'May cause high potassium', severity: 'moderate' },
        { food: 'Alcohol', effect: 'May increase dizziness', severity: 'low' }
      ],
      drugInteractions: [
        { drug: 'spironolactone', effect: 'Increased potassium levels', severity: 'high' },
        { drug: 'ibuprofen', effect: 'May reduce blood pressure effect', severity: 'moderate' }
      ]
    },
    'amoxicillin': {
      name: 'Amoxicillin',
      category: 'Antibiotic',
      description: 'Penicillin antibiotic for bacterial infections',
      sideEffects: ['Nausea', 'Diarrhea', 'Rash', 'Yeast infections'],
      contraindications: ['Penicillin allergy', 'Mononucleosis'],
      foodInteractions: [
        { food: 'Dairy products', effect: 'May reduce absorption (take 1 hour before or 2 hours after)', severity: 'low' }
      ],
      drugInteractions: [
        { drug: 'warfarin', effect: 'May increase warfarin effect', severity: 'moderate' },
        { drug: 'oral contraceptives', effect: 'May reduce contraceptive effectiveness', severity: 'moderate' }
      ]
    },
    'ibuprofen': {
      name: 'Ibuprofen',
      category: 'NSAID',
      description: 'Anti-inflammatory pain reliever',
      sideEffects: ['Stomach upset', 'Heartburn', 'Dizziness', 'Kidney problems'],
      contraindications: ['Peptic ulcer', 'Kidney disease', 'Heart disease', 'Aspirin allergy'],
      foodInteractions: [
        { food: 'Alcohol', effect: 'Increases stomach bleeding risk', severity: 'high' }
      ],
      drugInteractions: [
        { drug: 'warfarin', effect: 'Increased bleeding risk', severity: 'moderate' },
        { drug: 'lisinopril', effect: 'May reduce blood pressure effect', severity: 'moderate' },
        { drug: 'lithium', effect: 'May increase lithium levels', severity: 'high' }
      ]
    }
  };

  // Get drug information
  static getDrugInfo(drugName) {
    const drug = this.drugDatabase[drugName.toLowerCase()];
    if (!drug) {
      return {
        success: false,
        message: 'Drug not found in database'
      };
    }

    return {
      success: true,
      data: drug
    };
  }

  // Check drug-drug interactions
  static checkDrugInteractions(medications) {
    const interactions = [];
    
    for (let i = 0; i < medications.length; i++) {
      for (let j = i + 1; j < medications.length; j++) {
        const drug1 = medications[i].toLowerCase();
        const drug2 = medications[j].toLowerCase();
        
        const drug1Info = this.drugDatabase[drug1];
        const drug2Info = this.drugDatabase[drug2];
        
        if (drug1Info && drug1Info.drugInteractions) {
          const interaction = drug1Info.drugInteractions.find(
            inter => inter.drug.toLowerCase() === drug2
          );
          
          if (interaction) {
            interactions.push({
              drug1: drug1Info.name,
              drug2: drug2Info ? drug2Info.name : drug2,
              effect: interaction.effect,
              severity: interaction.severity,
              recommendation: this.getInteractionRecommendation(interaction.severity)
            });
          }
        }
      }
    }

    return {
      success: true,
      interactions,
      hasInteractions: interactions.length > 0,
      highRiskInteractions: interactions.filter(i => i.severity === 'high').length
    };
  }

  // Check food-drug interactions
  static checkFoodInteractions(drugName, foods = []) {
    const drug = this.drugDatabase[drugName.toLowerCase()];
    if (!drug || !drug.foodInteractions) {
      return {
        success: true,
        interactions: [],
        hasInteractions: false
      };
    }

    let relevantInteractions = drug.foodInteractions;
    
    // If specific foods are provided, filter interactions
    if (foods.length > 0) {
      relevantInteractions = drug.foodInteractions.filter(interaction =>
        foods.some(food => 
          interaction.food.toLowerCase().includes(food.toLowerCase()) ||
          food.toLowerCase().includes(interaction.food.toLowerCase())
        )
      );
    }

    return {
      success: true,
      drugName: drug.name,
      interactions: relevantInteractions.map(interaction => ({
        ...interaction,
        recommendation: this.getFoodInteractionRecommendation(interaction)
      })),
      hasInteractions: relevantInteractions.length > 0
    };
  }

  // Check drug incompatibilities (for IV medications)
  static checkIncompatibilities(drug1, drug2) {
    // Simple incompatibility database
    const incompatibilities = {
      'furosemide': ['dopamine', 'dobutamine', 'milrinone'],
      'heparin': ['dopamine', 'dobutamine', 'phenytoin'],
      'phenytoin': ['heparin', 'dopamine', 'insulin'],
      'insulin': ['phenytoin', 'furosemide']
    };

    const drug1Lower = drug1.toLowerCase();
    const drug2Lower = drug2.toLowerCase();

    const isIncompatible = 
      incompatibilities[drug1Lower]?.includes(drug2Lower) ||
      incompatibilities[drug2Lower]?.includes(drug1Lower);

    return {
      success: true,
      incompatible: isIncompatible,
      drugs: [drug1, drug2],
      recommendation: isIncompatible ? 
        'These medications are incompatible. Use separate IV lines or administer at different times.' :
        'No known incompatibility found.'
    };
  }

  // Get interaction recommendation
  static getInteractionRecommendation(severity) {
    switch (severity) {
      case 'high':
        return 'AVOID combination. Consult physician immediately.';
      case 'moderate':
        return 'Monitor closely. Consider dose adjustment or alternative.';
      case 'low':
        return 'Monitor patient. Usually manageable with precautions.';
      default:
        return 'Monitor patient as clinically appropriate.';
    }
  }

  // Get food interaction recommendation
  static getFoodInteractionRecommendation(interaction) {
    switch (interaction.severity) {
      case 'high':
        return 'AVOID this food/drink while taking medication.';
      case 'moderate':
        return 'Limit intake and monitor for effects.';
      case 'low':
        return 'Be aware of potential interaction. Monitor as needed.';
      default:
        return 'Follow general dietary guidelines.';
    }
  }

  // Search drugs by name or category
  static searchDrugs(query) {
    const results = [];
    const searchTerm = query.toLowerCase();

    Object.entries(this.drugDatabase).forEach(([key, drug]) => {
      if (
        drug.name.toLowerCase().includes(searchTerm) ||
        drug.category.toLowerCase().includes(searchTerm) ||
        drug.description.toLowerCase().includes(searchTerm)
      ) {
        results.push({
          id: key,
          name: drug.name,
          category: drug.category,
          description: drug.description
        });
      }
    });

    return {
      success: true,
      results,
      count: results.length
    };
  }

  // Get all drug categories
  static getCategories() {
    const categories = [...new Set(
      Object.values(this.drugDatabase).map(drug => drug.category)
    )];

    return {
      success: true,
      categories: categories.sort()
    };
  }

  // Get drugs by category
  static getDrugsByCategory(category) {
    const drugs = Object.entries(this.drugDatabase)
      .filter(([key, drug]) => drug.category.toLowerCase() === category.toLowerCase())
      .map(([key, drug]) => ({
        id: key,
        name: drug.name,
        description: drug.description
      }));

    return {
      success: true,
      category,
      drugs,
      count: drugs.length
    };
  }

  // Comprehensive drug analysis
  static analyzePrescription(medications, patientAllergies = [], patientConditions = []) {
    const analysis = {
      medications: medications.map(med => med.toLowerCase()),
      drugInteractions: this.checkDrugInteractions(medications),
      contraindications: [],
      allergyAlerts: [],
      recommendations: []
    };

    // Check each medication
    medications.forEach(medName => {
      const drug = this.drugDatabase[medName.toLowerCase()];
      if (drug) {
        // Check allergies
        if (patientAllergies.some(allergy => 
          drug.name.toLowerCase().includes(allergy.toLowerCase()) ||
          drug.category.toLowerCase().includes(allergy.toLowerCase())
        )) {
          analysis.allergyAlerts.push({
            drug: drug.name,
            allergy: patientAllergies.find(allergy => 
              drug.name.toLowerCase().includes(allergy.toLowerCase()) ||
              drug.category.toLowerCase().includes(allergy.toLowerCase())
            ),
            severity: 'high'
          });
        }

        // Check contraindications
        drug.contraindications.forEach(contraindication => {
          if (patientConditions.some(condition => 
            condition.toLowerCase().includes(contraindication.toLowerCase()) ||
            contraindication.toLowerCase().includes(condition.toLowerCase())
          )) {
            analysis.contraindications.push({
              drug: drug.name,
              contraindication,
              patientCondition: patientConditions.find(condition => 
                condition.toLowerCase().includes(contraindication.toLowerCase()) ||
                contraindication.toLowerCase().includes(condition.toLowerCase())
              )
            });
          }
        });
      }
    });

    // Generate recommendations
    if (analysis.allergyAlerts.length > 0) {
      analysis.recommendations.push('CRITICAL: Allergy alerts found. Review patient allergies before prescribing.');
    }
    
    if (analysis.contraindications.length > 0) {
      analysis.recommendations.push('WARNING: Contraindications found. Consider alternative medications.');
    }
    
    if (analysis.drugInteractions.highRiskInteractions > 0) {
      analysis.recommendations.push('HIGH RISK: Significant drug interactions detected. Consult pharmacist.');
    }

    return {
      success: true,
      analysis
    };
  }
}

module.exports = DrugInformationService;
const labTestTemplates = [
    {
      id: "cbc",
      name: "Complete Blood Count (CBC)",
      description: "Basic blood test that checks overall health and detects disorders",
      parameters: [
        {
          name: "Hemoglobin (Hb)",
          unit: "g/dL",
          refRange: "13.5 - 17.5"
        },
        {
          name: "Red Blood Cells (RBC)",
          unit: "million/µL",
          refRange: "4.5 - 5.9"
        },
        {
          name: "White Blood Cells (WBC)",
          unit: "thousand/µL",
          refRange: "4.5 - 11.0"
        },
        {
          name: "Platelets",
          unit: "thousand/µL",
          refRange: "150 - 450"
        },
        {
          name: "Hematocrit (HCT)",
          unit: "%",
          refRange: "41 - 50"
        },
        {
          name: "Mean Corpuscular Volume (MCV)",
          unit: "fL",
          refRange: "80 - 96"
        },
        {
          name: "Mean Corpuscular Hemoglobin (MCH)",
          unit: "pg",
          refRange: "27.5 - 33.2"
        },
        {
          name: "Mean Corpuscular Hemoglobin Concentration (MCHC)",
          unit: "g/dL",
          refRange: "33.4 - 35.5"
        },
        {
          name: "Red Cell Distribution Width (RDW)",
          unit: "%",
          refRange: "11.5 - 14.5"
        },
        {
          name: "Neutrophils",
          unit: "%",
          refRange: "40 - 75"
        },
        {
          name: "Lymphocytes",
          unit: "%",
          refRange: "20 - 45"
        },
        {
          name: "Monocytes",
          unit: "%",
          refRange: "2 - 10"
        },
        {
          name: "Eosinophils",
          unit: "%",
          refRange: "1 - 6"
        },
        {
          name: "Basophils",
          unit: "%",
          refRange: "0 - 1"
        }
      ]
    },
    {
      id: "lft",
      name: "Liver Function Test (LFT)",
      description: "Evaluates how well your liver is working",
      parameters: [
        {
          name: "Total Bilirubin",
          unit: "mg/dL",
          refRange: "0.1 - 1.2"
        },
        {
          name: "Direct Bilirubin",
          unit: "mg/dL",
          refRange: "0 - 0.3"
        },
        {
          name: "Indirect Bilirubin",
          unit: "mg/dL",
          refRange: "0.1 - 0.8"
        },
        {
          name: "Serum Glutamic-Oxaloacetic Transaminase (SGOT/AST)",
          unit: "U/L",
          refRange: "5 - 40"
        },
        {
          name: "Serum Glutamic-Pyruvic Transaminase (SGPT/ALT)",
          unit: "U/L",
          refRange: "7 - 56"
        },
        {
          name: "Alkaline Phosphatase (ALP)",
          unit: "U/L",
          refRange: "44 - 147"
        },
        {
          name: "Gamma-Glutamyl Transferase (GGT)",
          unit: "U/L",
          refRange: "8 - 61"
        },
        {
          name: "Total Protein",
          unit: "g/dL",
          refRange: "6.0 - 8.3"
        },
        {
          name: "Albumin",
          unit: "g/dL",
          refRange: "3.5 - 5.0"
        },
        {
          name: "Globulin",
          unit: "g/dL",
          refRange: "2.3 - 3.5"
        },
        {
          name: "A/G Ratio",
          unit: "",
          refRange: "1.1 - 2.2"
        }
      ]
    },
    {
      id: "thyroid",
      name: "Thyroid Profile",
      description: "Measures thyroid hormone levels to evaluate thyroid function",
      parameters: [
        {
          name: "Thyroid Stimulating Hormone (TSH)",
          unit: "μIU/mL",
          refRange: "0.4 - 4.0"
        },
        {
          name: "Free Thyroxine (FT4)",
          unit: "ng/dL",
          refRange: "0.8 - 1.8"
        },
        {
          name: "Free Triiodothyronine (FT3)",
          unit: "pg/mL",
          refRange: "2.3 - 4.2"
        },
        {
          name: "Total Thyroxine (T4)",
          unit: "μg/dL",
          refRange: "4.5 - 12.0"
        },
        {
          name: "Total Triiodothyronine (T3)",
          unit: "ng/dL",
          refRange: "80 - 200"
        },
        {
          name: "Thyroid Peroxidase Antibodies (TPO)",
          unit: "IU/mL",
          refRange: "< 35"
        },
        {
          name: "Thyroglobulin Antibodies (TgAb)",
          unit: "IU/mL",
          refRange: "< 20"
        }
      ]
    },
    {
      id: "lipid",
      name: "Lipid Profile",
      description: "Measures blood cholesterol levels and other fatty substances",
      parameters: [
        {
          name: "Total Cholesterol",
          unit: "mg/dL",
          refRange: "< 200"
        },
        {
          name: "Triglycerides",
          unit: "mg/dL",
          refRange: "< 150"
        },
        {
          name: "High-Density Lipoprotein (HDL) Cholesterol",
          unit: "mg/dL",
          refRange: "> 40"
        },
        {
          name: "Low-Density Lipoprotein (LDL) Cholesterol",
          unit: "mg/dL",
          refRange: "< 100"
        },
        {
          name: "Very Low-Density Lipoprotein (VLDL) Cholesterol",
          unit: "mg/dL",
          refRange: "< 30"
        },
        {
          name: "Total Cholesterol/HDL Ratio",
          unit: "",
          refRange: "< 5.0"
        },
        {
          name: "LDL/HDL Ratio",
          unit: "",
          refRange: "< 3.0"
        },
        {
          name: "Non-HDL Cholesterol",
          unit: "mg/dL",
          refRange: "< 130"
        }
      ]
    },
    {
      id: "diabetes",
      name: "Diabetes Screening",
      description: "Screens for diabetes and pre-diabetes conditions",
      parameters: [
        {
          name: "Fasting Blood Glucose",
          unit: "mg/dL",
          refRange: "70 - 100"
        },
        {
          name: "Post Prandial Blood Glucose",
          unit: "mg/dL",
          refRange: "< 140"
        },
        {
          name: "Random Blood Glucose",
          unit: "mg/dL",
          refRange: "< 200"
        },
        {
          name: "Glycosylated Hemoglobin (HbA1c)",
          unit: "%",
          refRange: "< 5.7"
        },
        {
          name: "Insulin (Fasting)",
          unit: "μIU/mL",
          refRange: "2.6 - 24.9"
        },
        {
          name: "C-Peptide",
          unit: "ng/mL",
          refRange: "0.8 - 3.1"
        },
        {
          name: "Insulin Resistance (HOMA-IR)",
          unit: "",
          refRange: "< 3.0"
        }
      ]
    }
  ];
  
  export default labTestTemplates;
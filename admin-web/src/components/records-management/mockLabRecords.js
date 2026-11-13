export const mockLabPets = [
  {
    id: "PET-0071",
    petID: "PET-0071",
    petName: "Candelario",
    name: "Candelario",
    breed: "Pomeranian",
    species: "Dog",
    gender: "Female",
    weight: "5 kg",
    owner: "Zechariah Runte"
  },
  {
    id: "PET-0072",
    petID: "PET-0072",
    petName: "Cameron",
    name: "Cameron",
    breed: "Beagle",
    species: "Dog",
    gender: "Male",
    weight: "8 kg",
    owner: "Morgan Cameron"
  },
  {
    id: "PET-0073",
    petID: "PET-0073",
    petName: "Lucile",
    name: "Lucile",
    breed: "Domestic Shorthair",
    species: "Cat",
    gender: "Female",
    weight: "4 kg",
    owner: "Taylor Lucile"
  },
  {
    id: "PET-0074",
    petID: "PET-0074",
    petName: "Rowan",
    name: "Rowan",
    breed: "Labrador Retriever",
    species: "Dog",
    gender: "Male",
    weight: "24 kg",
    owner: "Jordan Rowan"
  }
];

export const mockLabVisits = [
  { id: "VIS-0106", petId: "PET-0071", petName: "Candelario", date: "2026-11-03", veterinarian: "Dr. Sofia Reyes" },
  { id: "VIS-0105", petId: "PET-0072", petName: "Cameron", date: "2026-11-03", veterinarian: "Dr. Miguel Santos" },
  { id: "VIS-0104", petId: "PET-0073", petName: "Lucile", date: "2026-11-02", veterinarian: "Dr. Ana Cruz" }
];

export const mockLabRecords = [
  {
    id: "LAB-0038",
    petID: "PET-0071",
    petName: "Candelario",
    owner: "Zechariah Runte",
    type: "lab",
    recordTitle: "Complete blood count",
    uploadedOn: "2026-11-03",
    recordStatus: "uploaded",
    isUploaded: true,
    veterinarian: "Dr. Sofia Reyes",
    visitId: "VIS-0106",
    originalName: "CBC_Candelario_2026-11-03.pdf",
    fileSize: "248 KB",
    interpretation: "Values are within the laboratory reference ranges. Review alongside the patient’s clinical findings.",
    results: [
      { parameter: "Hemoglobin", result: "14.5", unit: "g/dL", referenceRange: "12.0–18.0" },
      { parameter: "White blood cells", result: "9.8", unit: "× 10³/µL", referenceRange: "6.0–17.0" },
      { parameter: "Red blood cells", result: "6.4", unit: "× 10⁶/µL", referenceRange: "5.5–8.5" },
      { parameter: "Platelets", result: "285", unit: "× 10³/µL", referenceRange: "200–500" }
    ]
  },
  {
    id: "LAB-0037",
    petID: "PET-0072",
    petName: "Cameron",
    owner: "Morgan Cameron",
    type: "lab",
    recordTitle: "Urinalysis",
    uploadedOn: "2026-11-03",
    recordStatus: "draft",
    isUploaded: false,
    veterinarian: "Dr. Miguel Santos",
    visitId: "VIS-0105",
    originalName: "",
    results: []
  },
  {
    id: "LAB-0036",
    petID: "PET-0073",
    petName: "Lucile",
    owner: "Taylor Lucile",
    type: "lab",
    recordTitle: "Blood chemistry",
    uploadedOn: "2026-11-02",
    recordStatus: "uploaded",
    isUploaded: true,
    veterinarian: "Dr. Ana Cruz",
    visitId: "VIS-0104",
    originalName: "Blood_Chemistry_Lucile.pdf",
    fileSize: "196 KB",
    results: []
  },
  {
    id: "LAB-0035",
    petID: "PET-0071",
    petName: "Candelario",
    owner: "Zechariah Runte",
    type: "lab",
    recordTitle: "Urinalysis",
    uploadedOn: "2026-10-20",
    recordStatus: "uploaded",
    isUploaded: true,
    veterinarian: "Dr. Sofia Reyes",
    originalName: "Urinalysis_Candelario.pdf",
    fileSize: "174 KB",
    results: []
  },
  {
    id: "LAB-0034",
    petID: "PET-0071",
    petName: "Candelario",
    owner: "Zechariah Runte",
    type: "lab",
    recordTitle: "Fecal analysis",
    uploadedOn: "2026-10-05",
    recordStatus: "uploaded",
    isUploaded: true,
    veterinarian: "Dr. Sofia Reyes",
    originalName: "Fecal_Analysis_Candelario.pdf",
    fileSize: "152 KB",
    results: []
  },
  {
    id: "LAB-0033",
    petID: "PET-0074",
    petName: "Rowan",
    owner: "Jordan Rowan",
    type: "lab",
    recordTitle: "Skin scraping",
    uploadedOn: "2026-10-04",
    recordStatus: "uploaded",
    isUploaded: true,
    veterinarian: "Dr. Miguel Santos",
    originalName: "Skin_Scraping_Rowan.pdf",
    fileSize: "163 KB",
    results: []
  }
];

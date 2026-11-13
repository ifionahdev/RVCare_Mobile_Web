import { useState, useEffect } from "react";
import { X, Copy, Check, AlertCircle } from "lucide-react";
import api from "../../api/axios";

const AddOwnerModal = ({ isOpen, onClose, onSave, onError, initialData }) => {
  const todayIso = new Date().toISOString().split("T")[0];
  const ownerMaxDob = new Date();
  ownerMaxDob.setFullYear(ownerMaxDob.getFullYear() - 18);
  const ownerMaxDobIso = ownerMaxDob.toISOString().split("T")[0];

  const [ownerData, setOwnerData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    sex: "",
    dob: "",
  });

  const [petData, setPetData] = useState({
    type: "",
    breed: "",
    customBreed: "",
    name: "",
    sex: "",
    weight: "",
    color: "",
    dob: "",
    notes: "",
  });

  const [step, setStep] = useState("form");
  const [copiedField, setCopiedField] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // State for breeds from database
  const [dogBreeds, setDogBreeds] = useState([]);
  const [catBreeds, setCatBreeds] = useState([]);
  const [loadingBreeds, setLoadingBreeds] = useState(false);
  const TWO_DIGIT_WEIGHT_REGEX = /^\d{1,2}$/;
  const MAX_OWNER_NAME_LENGTH = 50;
  const MAX_PET_NAME_LENGTH = 50;
  const MAX_PET_NOTES_LENGTH = 500;

  const normalizePhoneInput = (value = "") => {
    const digits = String(value).replace(/\D/g, "");

    if (!digits) return "";
    if (digits.startsWith("63")) return digits.slice(2, 12);
    if (digits.startsWith("0")) return digits.slice(1, 11);
    return digits.slice(0, 10);
  };

  // Enhanced date formatting function
  const formatDateForInput = (dateString) => {
    
    if (!dateString || dateString === "Invalid Date" || dateString === "null") return "";
    
    try {
      let date;
      
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
      }
      
      date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        return "";
      }
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error("Error formatting date:", error, dateString);
      return "";
    }
  };

  // Fetch breeds from database
  const fetchBreeds = async (species) => {
    try {
      setLoadingBreeds(true);
      const response = await api.get(`/admin/breeds?species=${species}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${species} breeds:`, error);
      return [];
    } finally {
      setLoadingBreeds(false);
    }
  };

  // Load breeds when component mounts or when pet type changes
  useEffect(() => {
    const loadBreeds = async () => {
      if (!dogBreeds.length) {
        const dogBreedsData = await fetchBreeds('Dog');
        setDogBreeds(dogBreedsData);
      }
      if (!catBreeds.length) {
        const catBreedsData = await fetchBreeds('Cat');
        setCatBreeds(catBreedsData);
      }
    };

    if (isOpen) {
      loadBreeds();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      
      if (initialData) {
        // Editing existing owner - use direct fields to avoid incorrect name splitting
        const firstName = initialData.firstName || '';
        const lastName = initialData.lastName || '';
        
        
        setOwnerData({
          firstName: firstName,
          lastName: lastName,
          email: initialData.email || "",
          phone: normalizePhoneInput(initialData.phone || ""),
          address: initialData.address || "",
          sex: initialData.gender || "",
          dob: formatDateForInput(initialData.dateOfBirth) || "",
        });

        if (initialData.pets && initialData.pets[0]) {
          const pet = initialData.pets[0];
          
          setPetData({
            type: pet.petType || pet.type || "",
            breed: pet.breed || pet.breedName || "",
            name: pet.petName || pet.name || "",
            sex: pet.petGender || pet.gender || pet.sex || "",
            weight: pet.weight ? pet.weight.replace(' kg', '') : "",
            color: pet.color || "",
            dob: formatDateForInput(pet.petDateOfBirth || pet.dob) || "",
            notes: pet.note || pet.notes || "",
          });
        } else {
          // Reset pet data if no pets
          setPetData({
            type: "",
            breed: "",
            name: "",
            sex: "",
            weight: "",
            color: "",
            dob: "",
            notes: "",
          });
        }
      } else {
        // New owner - reset all fields
        setOwnerData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          address: "",
          sex: "",
          dob: "",
        });
        setPetData({
          type: "",
          breed: "",
          name: "",
          sex: "",
          weight: "",
          color: "",
          dob: "",
          notes: "",
        });
        setStep("form");
        setCopiedField(null);
        setErrors({});
      }
    }
  }, [initialData, isOpen]);

  // Validation functions
  const validateRequired = (value, field) => {
    if (!String(value || "").trim()) return `${field} is required`;
    return "";
  };

  const validateOwnerForm = () => {
    const newErrors = {};
    
    // Owner validations
    newErrors.firstName = validateRequired(ownerData.firstName, "First name");
    newErrors.lastName = validateRequired(ownerData.lastName, "Last name");
    newErrors.email = validateRequired(ownerData.email, "Email");
        if (ownerData.email && /\s/.test(ownerData.email)) {
          newErrors.email = "Email must not contain spaces";
        }

    newErrors.phone = validateRequired(ownerData.phone, "Phone number");
    newErrors.sex = validateRequired(ownerData.sex, "Gender");
    newErrors.dob = validateRequired(ownerData.dob, "Date of birth");
    
    // Date of birth validation (optional but if provided, must be valid)
    if (ownerData.dob) {
      if (ownerData.dob > todayIso) {
        newErrors.dob = "Date of birth cannot be in the future";
      } else if (ownerData.dob > ownerMaxDobIso) {
        newErrors.dob = "Owner must be older than 18 years old";
      }
    }

    if (ownerData.phone && !/^9\d{9}$/.test(ownerData.phone)) {
      newErrors.phone = "Phone number must be 10 digits and start with 9";
    }

    if (ownerData.firstName?.trim() && ownerData.firstName.trim().length > MAX_OWNER_NAME_LENGTH) {
      newErrors.firstName = `First name must be ${MAX_OWNER_NAME_LENGTH} characters or fewer`;
    }

    if (ownerData.lastName?.trim() && ownerData.lastName.trim().length > MAX_OWNER_NAME_LENGTH) {
      newErrors.lastName = `Last name must be ${MAX_OWNER_NAME_LENGTH} characters or fewer`;
    }

    // PET VALIDATIONS - REQUIRED FOR NEW OWNERS
    if (!initialData) {
      // Pet validations for NEW owners (required)
      newErrors.petName = validateRequired(petData.name, "Pet name");
      newErrors.petType = validateRequired(petData.type, "Pet type");
      if (!petData.breed) {
        newErrors.petBreed = "Breed is required";
      } else if (petData.breed === "other" && !petData.customBreed?.trim()) {
        newErrors.petBreed = "Please enter a custom breed name";
      }
      newErrors.petSex = validateRequired(petData.sex, "Pet gender");
      newErrors.petWeight = validateRequired(petData.weight, "Weight");
      if (petData.weight && !TWO_DIGIT_WEIGHT_REGEX.test(String(petData.weight))) {
        newErrors.petWeight = "Weight must be a 1-2 digit number (1-99)";
      }
      newErrors.petDob = validateRequired(petData.dob, "Pet date of birth");

      // Date of birth validation for pet
      if (petData.dob) {
        if (petData.dob > todayIso) {
          newErrors.petDob = "Pet date of birth cannot be in the future";
        }
      }

      if (petData.name?.trim() && petData.name.trim().length > MAX_PET_NAME_LENGTH) {
        newErrors.petName = `Pet name must be ${MAX_PET_NAME_LENGTH} characters or fewer`;
      }

      if (petData.notes?.trim() && petData.notes.trim().length > MAX_PET_NOTES_LENGTH) {
        newErrors.petNotes = `Pet notes must be ${MAX_PET_NOTES_LENGTH} characters or fewer`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).filter(key => newErrors[key]).length === 0;
  };

  const handleOwnerChange = (field, value) => {
    if (field === "firstName" || field === "lastName") {
      value = value.replace(/[^\p{L}\s]/gu, "");
      value = value.slice(0, MAX_OWNER_NAME_LENGTH);
    }

    if (field === "phone") {
      value = normalizePhoneInput(value);
    }

    if (field === "email") {
      value = String(value || "").replace(/\s+/g, "");
    }

    setOwnerData({ ...ownerData, [field]: value });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handlePetChange = (field, value) => {
    // Don't allow pet changes when editing existing owner
    if (initialData) return;
    
    if (field === "name" || field === "color") {
      value = value.replace(/[^\p{L}\s]/gu, "");
    }

    if (field === "name") {
      value = value.slice(0, MAX_PET_NAME_LENGTH);
    }

    if (field === "notes") {
      value = String(value || "").slice(0, MAX_PET_NOTES_LENGTH);
    }

    if (field === "weight") {
      value = String(value || "").replace(/\D/g, "").slice(0, 2);
    }

    const updated = { ...petData, [field]: value };
    if (field === "type") {
      updated.breed = "";
      updated.customBreed = "";
    }
    if (field === "breed" && value !== "other") {
      updated.customBreed = "";
    }
    setPetData(updated);
    
    // Clear error when user starts typing
    if (errors[`pet${field.charAt(0).toUpperCase() + field.slice(1)}`]) {
      setErrors(prev => ({ ...prev, [`pet${field.charAt(0).toUpperCase() + field.slice(1)}`]: "" }));
    }
  };

  const handleNext = () => {
    if (validateOwnerForm()) {
      setStep("review");
    }
  };
  
  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      
      // PET DATA IS REQUIRED FOR NEW OWNERS
      const finalBreed = petData.breed === "other" ? petData.customBreed : petData.breed;
      const safePetData = {
        type: petData.type || "",
        breed: finalBreed || "",
        name: petData.name || "",
        sex: petData.sex || "",
        weight: petData.weight || "",
        color: petData.color || "",
        dob: petData.dob || "",
        notes: petData.notes || "",
      };

      const safeOwnerData = {
        firstName: ownerData.firstName || "",
        lastName: ownerData.lastName || "",
        email: ownerData.email || "",
        phone: ownerData.phone || "",
        address: ownerData.address || "",
        sex: ownerData.sex || "",
        dob: ownerData.dob || "",
        // PETS ARE REQUIRED FOR NEW OWNERS
        pets: initialData ? [] : [safePetData] // Always include pet for new owners
      };

      // Call onSave and get the response
      const response = await onSave(safeOwnerData);
      
      if (initialData) {
        // Editing - just close the modal after success
        handleClose();
      } else {
        // Creating new owner - show success state briefly before closing.
        setStep("success");
        setTimeout(() => {
          handleClose();
        }, 1500);
      }
      
    } catch (error) {
      console.error("Error saving owner:", error);
      
      // Handle specific API errors
      if (error.response?.data?.message?.includes("Email already exists")) {
        onError?.("This email address is already registered. Please use a different email.");
        setStep("form");
      } else if (error.response?.data?.message) {
        onError?.(error.response.data.message);
      } else {
        onError?.("Failed to save owner. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep("form");
    setOwnerData({ firstName: "", lastName: "", email: "", phone: "", address: "", sex: "", dob: "" });
    setPetData({ type: "", breed: "", name: "", sex: "", weight: "", color: "", dob: "", notes: "" });
    setCopiedField(null);
    setErrors({});
    setIsLoading(false);
    onClose();
  };

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  if (!isOpen) return null;

  const breedOptions = (petData.type === "Dog" ? dogBreeds : petData.type === "Cat" ? catBreeds : [])
    .map((breed) => breed?.breedName ?? breed)
    .filter(Boolean);
  const isEditing = !!initialData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-[900px] h-[600px] rounded-2xl shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
          <h2 className="text-lg font-semibold text-gray-800">
            {isEditing ? "Edit Pet Owner" : "Add New Pet Owner"}
          </h2>
          <button 
            onClick={handleClose}
            className="p-1 hover:bg-white rounded-lg transition-colors duration-200"
            disabled={isLoading}
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 overflow-auto">
          {step === "form" && (
            <div className="flex h-full gap-6">
              {/* Owner Information - Left Side */}
              <div className="flex-1 space-y-4 border-r border-gray-200 pr-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-5 bg-blue-500 rounded-full"></div>
                    <h3 className="text-base font-semibold text-gray-800">Owner Information</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-700">First Name *</label>
                        <input 
                          type="text" 
                          value={ownerData.firstName} 
                          onChange={(e) => handleOwnerChange("firstName", e.target.value)}
                          maxLength={MAX_OWNER_NAME_LENGTH}
                          className={`w-full px-2.5 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.firstName ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Enter first name"
                        />
                        {errors.firstName && (
                          <p className="text-red-500 text-xs flex items-center gap-1">
                            <AlertCircle size={12} />
                            {errors.firstName}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-700">Last Name *</label>
                        <input 
                          type="text" 
                          value={ownerData.lastName} 
                          onChange={(e) => handleOwnerChange("lastName", e.target.value)}
                          maxLength={MAX_OWNER_NAME_LENGTH}
                          className={`w-full px-2.5 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.lastName ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Enter last name"
                        />
                        {errors.lastName && (
                          <p className="text-red-500 text-xs flex items-center gap-1">
                            <AlertCircle size={12} />
                            {errors.lastName}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-700">Email Address *</label>
                      <input 
                        type="email" 
                        value={ownerData.email} 
                        onChange={(e) => handleOwnerChange("email", e.target.value)}
                        className={`w-full px-2.5 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.email ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter email address"
                      />
                      {errors.email && (
                        <p className="text-red-500 text-xs flex items-center gap-1">
                          <AlertCircle size={12} />
                          {errors.email}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-700">Phone Number *</label>
                      <div className={`flex items-center border rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent ${
                        errors.phone ? 'border-red-300' : 'border-gray-300'
                      }`}>
                        <span className="px-2.5 py-1.5 text-sm text-gray-600 bg-gray-50 border-r border-gray-300 rounded-l-lg">+63</span>
                        <input 
                          type="tel"
                          pattern="[0-9]*"
                            inputMode="numeric"
                          maxLength={10}
                          value={ownerData.phone} 
                          onChange={(e) => handleOwnerChange("phone", e.target.value)}
                          className="w-full px-2.5 py-1.5 text-sm rounded-r-lg focus:outline-none"
                          placeholder="9XXXXXXXXX"
                        />
                      </div>
                      {errors.phone && (
                        <p className="text-red-500 text-xs flex items-center gap-1">
                          <AlertCircle size={12} />
                          {errors.phone}
                        </p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-700">Gender *</label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="owner-sex"
                              value="Male"
                              checked={ownerData.sex === "Male"}
                              onChange={(e) => handleOwnerChange("sex", e.target.value)}
                              className="w-4 h-4 text-blue-500 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Male</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="owner-sex"
                              value="Female"
                              checked={ownerData.sex === "Female"}
                              onChange={(e) => handleOwnerChange("sex", e.target.value)}
                              className="w-4 h-4 text-blue-500 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Female</span>
                          </label>
                        </div>
                        {errors.sex && (
                          <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                            <AlertCircle size={12} />
                            {errors.sex}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-700">Date of Birth *</label>
                        <input 
                          type="date" 
                          value={ownerData.dob} 
                          onChange={(e) => handleOwnerChange("dob", e.target.value)}
                          max={ownerMaxDobIso}
                          className={`w-full px-2.5 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.dob ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {errors.dob && (
                          <p className="text-red-500 text-xs flex items-center gap-1">
                            <AlertCircle size={12} />
                            {errors.dob}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-700">Address</label>
                      <input 
                        type="text" 
                        value={ownerData.address} 
                        onChange={(e) => handleOwnerChange("address", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter address"
                      />
                      {errors.address && (
                        <p className="text-red-500 text-xs flex items-center gap-1">
                          <AlertCircle size={12} />
                          {errors.address}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pet Information - Right Side */}
              <div className="flex-1 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-5 bg-green-500 rounded-full"></div>
                    <h3 className="text-base font-semibold text-gray-800">Pet Information</h3>
                    <span className="text-xs text-gray-500">
                      {isEditing ? "(View Only)" : "REQUIRED"}
                    </span>
                    {isEditing && (
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                        Use Add Pet modal to manage pets
                      </span>
                    )}
                  </div>
                  
                  {isEditing ? (
                    // View-only mode for editing
                    <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-sm text-gray-600">
                        <p className="mb-2">Pet information cannot be edited here. To add or edit pets for this owner:</p>
                        <ul className="list-disc list-inside space-y-1 text-gray-500">
                          <li>Use the "Add Pet" button in the Pets tab</li>
                          <li>Or edit existing pets from the Pets table</li>
                        </ul>
                      </div>
                      
                      {/* Display existing pet info if available */}
                      {petData.name && (
                        <div className="mt-4 p-3 bg-white rounded border">
                          <h4 className="font-medium text-gray-800 mb-2">Current Pet:</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><span className="text-gray-600">Name:</span> {petData.name}</div>
                            <div><span className="text-gray-600">Type:</span> {petData.type}</div>
                            <div><span className="text-gray-600">Breed:</span> {petData.breed === "other" ? petData.customBreed : petData.breed}</div>
                            <div><span className="text-gray-600">Gender:</span> {petData.sex}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    // REQUIRED PET FIELDS FOR NEW OWNERS
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-gray-700">Pet Type *</label>
                          <select 
                            value={petData.type} 
                            onChange={(e) => handlePetChange("type", e.target.value)}
                            className={`w-full px-2.5 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                              errors.petType ? 'border-red-300' : 'border-gray-300'
                            }`}
                          >
                            <option value="">Select type</option>
                            <option value="Dog">Dog</option>
                            <option value="Cat">Cat</option>
                          </select>
                          {errors.petType && (
                            <p className="text-red-500 text-xs flex items-center gap-1">
                              <AlertCircle size={12} />
                              {errors.petType}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-gray-700">Breed *</label>
                          <select 
                            value={petData.breed} 
                            onChange={(e) => handlePetChange("breed", e.target.value)}
                            className={`w-full px-2.5 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                              errors.petBreed ? 'border-red-300' : 'border-gray-300'
                            }`}
                            disabled={!petData.type}
                          >
                            <option value="">Select breed</option>
                            {breedOptions.map((breed, index) => (
                              <option key={index} value={breed}>{breed}</option>
                            ))}
                            <option value="other">Other</option>
                          </select>
                          {errors.petBreed && (
                            <p className="text-red-500 text-xs flex items-center gap-1">
                              <AlertCircle size={12} />
                              {errors.petBreed}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Custom Breed Input - Show when "Other" is selected */}
                      {petData.breed === "other" && (
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-gray-700">Enter Custom Breed *</label>
                          <input 
                            type="text" 
                            value={petData.customBreed} 
                            onChange={(e) => {
                              const updated = { ...petData, customBreed: e.target.value };
                              setPetData(updated);
                            }}
                            placeholder="Enter the breed name..."
                            className={`w-full px-2.5 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                              errors.petBreed ? 'border-red-300' : 'border-gray-300'
                            }`}
                          />
                          {errors.petBreed && errors.petBreed.includes("custom") && (
                            <p className="text-red-500 text-xs flex items-center gap-1">
                              <AlertCircle size={12} />
                              {errors.petBreed}
                            </p>
                          )}
                        </div>
                      )}
                      
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-700">Pet Name *</label>
                        <input 
                          type="text" 
                          value={petData.name} 
                          onChange={(e) => handlePetChange("name", e.target.value)}
                          maxLength={MAX_PET_NAME_LENGTH}
                          className={`w-full px-2.5 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                            errors.petName ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Enter pet name"
                        />
                        {errors.petName && (
                          <p className="text-red-500 text-xs flex items-center gap-1">
                            <AlertCircle size={12} />
                            {errors.petName}
                          </p>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-gray-700">Gender *</label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="pet-sex"
                                value="Male"
                                checked={petData.sex === "Male"}
                                onChange={(e) => handlePetChange("sex", e.target.value)}
                                className="w-4 h-4 text-green-500 focus:ring-green-500"
                              />
                              <span className="text-sm text-gray-700">Male</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="pet-sex"
                                value="Female"
                                checked={petData.sex === "Female"}
                                onChange={(e) => handlePetChange("sex", e.target.value)}
                                className="w-4 h-4 text-green-500 focus:ring-green-500"
                              />
                              <span className="text-sm text-gray-700">Female</span>
                            </label>
                          </div>
                          {errors.petSex && (
                            <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                              <AlertCircle size={12} />
                              {errors.petSex}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-gray-700">Weight (kg) *</label>
                          <input 
                            type="number" 
                            value={petData.weight} 
                            onChange={(e) => handlePetChange("weight", e.target.value)}
                            className={`w-full px-2.5 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                              errors.petWeight ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="Enter weight"
                            step="0.1"
                            min="0"
                          />
                          {errors.petWeight && (
                            <p className="text-red-500 text-xs flex items-center gap-1">
                              <AlertCircle size={12} />
                              {errors.petWeight}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-gray-700">Color</label>
                          <input 
                            type="text" 
                            value={petData.color} 
                            onChange={(e) => handlePetChange("color", e.target.value)}
                            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Enter color"
                          />
                          {errors.petColor && (
                            <p className="text-red-500 text-xs flex items-center gap-1">
                              <AlertCircle size={12} />
                              {errors.petColor}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-gray-700">Date of Birth *</label>
                          <input 
                            type="date" 
                            value={petData.dob} 
                            onChange={(e) => handlePetChange("dob", e.target.value)}
                            max={todayIso}
                            className={`w-full px-2.5 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                              errors.petDob ? 'border-red-300' : 'border-gray-300'
                            }`}
                          />
                          {errors.petDob && (
                            <p className="text-red-500 text-xs flex items-center gap-1">
                              <AlertCircle size={12} />
                              {errors.petDob}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-700">Additional Notes</label>
                        <textarea 
                          value={petData.notes} 
                          onChange={(e) => handlePetChange("notes", e.target.value)}
                          maxLength={MAX_PET_NOTES_LENGTH}
                          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                          placeholder="Enter any additional notes (optional)"
                          rows="2"
                        />
                        <p className="text-xs text-gray-500 text-right">{petData.notes.length}/{MAX_PET_NOTES_LENGTH}</p>
                        {errors.petNotes && (
                          <p className="text-red-500 text-xs flex items-center gap-1">
                            <AlertCircle size={12} />
                            {errors.petNotes}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === "review" && (
            <div className="h-full flex flex-col">
              <div className="text-center mb-2">
                <h3 className="text-md font-semibold text-gray-800">Review Information</h3>
              </div>
              
              <div className="flex-1 grid grid-cols-2 gap-6">
                {/* Owner Details Card */}
                <div className="bg-white border border-gray-200 rounded-xl px-5 pt-4 pb-2 shadow-sm">
                  <div className="flex items-center gap-2 mb-2 pb-1 border-b border-gray-100">
                    <div className="w-2 h-4 bg-blue-500 rounded-full"></div>
                    <h4 className="font-semibold text-gray-800 text-sm">Owner Details</h4>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-gray-600 font-medium">Full Name:</span>
                      <span className="text-gray-800 font-semibold">{ownerData.firstName} {ownerData.lastName}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-gray-600 font-medium">Email:</span>
                      <span className="text-gray-800 font-semibold">{ownerData.email || "-"}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-gray-600 font-medium">Phone:</span>
                      <span className="text-gray-800 font-semibold">{ownerData.phone || "-"}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-gray-600 font-medium">Gender:</span>
                      <span className="text-gray-800 font-semibold">{ownerData.sex || "-"}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-gray-600 font-medium">Date of Birth:</span>
                      <span className="text-gray-800 font-semibold">{ownerData.dob || "-"}</span>
                    </div>
                    <div className="flex justify-between items-start py-2">
                      <span className="text-gray-600 font-medium">Address:</span>
                      <span className="text-gray-800 font-semibold text-right max-w-[200px]">{ownerData.address || "-"}</span>
                    </div>
                  </div>
                </div>

                {/* Pet Details Card - Only show for new owners */}
                {!isEditing && (
                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-2 pb-1 border-b border-gray-100">
                      <div className="w-2 h-4 bg-green-500 rounded-full"></div>
                      <h4 className="font-semibold text-gray-800 text-sm">Pet Details</h4>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between items-center py-2 border-b border-gray-50">
                        <span className="text-gray-600 font-medium">Pet Name:</span>
                        <span className="text-gray-800 font-semibold">{petData.name || "-"}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-50">
                        <span className="text-gray-600 font-medium">Type:</span>
                        <span className="text-gray-800 font-semibold">{petData.type || "-"}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-50">
                        <span className="text-gray-600 font-medium">Breed:</span>
                        <span className="text-gray-800 font-semibold">{petData.breed === "other" ? petData.customBreed : (petData.breed || "-")}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-50">
                        <span className="text-gray-600 font-medium">Gender:</span>
                        <span className="text-gray-800 font-semibold">{petData.sex || "-"}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-50">
                        <span className="text-gray-600 font-medium">Weight:</span>
                        <span className="text-gray-800 font-semibold">{petData.weight ? `${petData.weight} kg` : "-"}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-50">
                        <span className="text-gray-600 font-medium">Color:</span>
                        <span className="text-gray-800 font-semibold">{petData.color || "-"}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-50">
                        <span className="text-gray-600 font-medium">Date of Birth:</span>
                        <span className="text-gray-800 font-semibold">{petData.dob || "-"}</span>
                      </div>
                      <div className="flex justify-between items-start py-2">
                        <span className="text-gray-600 font-medium">Notes:</span>
                        <span className="text-gray-800 font-semibold text-right max-w-[200px]">{petData.notes || "-"}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-base">✓</span>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Owner Added Successfully!</h3>
              
              <p className="text-sm text-gray-600 mb-2">
                The owner account was created and login credentials were sent to the registered email.
              </p>
              <p className="text-xs text-gray-500">
                This window will close automatically.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-2xl">
          <div className="flex justify-end gap-2">
            {step === "form" && (
              <>
                <button 
                  onClick={handleClose}
                  className="px-4 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleNext}
                  className="px-4 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium"
                >
                  Continue
                </button>
              </>
            )}
            
            {step === "review" && (
              <>
                <button 
                  onClick={() => setStep("form")}
                  className="px-4 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                  disabled={isLoading}
                >
                  Back
                </button>
                <button 
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="px-4 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Saving..." : "Confirm & Save"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddOwnerModal;

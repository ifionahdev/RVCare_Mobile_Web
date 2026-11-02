import { useState, useEffect } from "react";
import { X, Search, AlertCircle } from "lucide-react";
import api from "../../api/axios"; 

const AddPetModal = ({ isOpen, onClose, onSave, owners, initialData, refreshPets, defaultOwnerId = "", lockOwnerSelection = false }) => {
  const MAX_PET_NAME_LENGTH = 50;
  const MAX_PET_NOTES_LENGTH = 500;

  const [petData, setPetData] = useState({
    ownerId: "",
    type: "",
    breed: "",
    customBreed: "",
    name: "",
    age: "",
    sex: "",
    weight: "",
    color: "",
    dob: "",
    notes: "",
  });

  const [speciesOptions, setSpeciesOptions] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [ownerSearch, setOwnerSearch] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const toInputDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d)) return ""; 
    return d.toISOString().split("T")[0];
  };

  const sanitizeNumber = (value) => {
    if (!value) return "";
    return value.toString().replace(/\D/g, "").slice(0, 2);
  };

  // Validation functions
  const validateField = (field, value) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case "ownerId":
        if (!value) newErrors.ownerId = "Owner is required";
        else delete newErrors.ownerId;
        break;
        
      case "type":
        if (!value) newErrors.type = "Pet type is required";
        else delete newErrors.type;
        break;
        
      case "breed":
        if (!value) newErrors.breed = "Breed is required";
        else if (value === "other" && !petData.customBreed?.trim()) {
          newErrors.breed = "Please enter a custom breed name";
        } else delete newErrors.breed;
        break;
        
      case "name":
        if (!value.trim()) newErrors.name = "Pet name is required";
        else if (value.trim().length < 2) newErrors.name = "Pet name must be at least 2 characters";
        else if (value.trim().length > MAX_PET_NAME_LENGTH) newErrors.name = `Pet name must be ${MAX_PET_NAME_LENGTH} characters or fewer`;
        else if (!/^[a-zA-Z\s]+$/.test(value.trim())) newErrors.name = "Pet name can only contain letters and spaces";
        else delete newErrors.name;
        break;

      case "notes":
        if (value?.trim() && value.trim().length > MAX_PET_NOTES_LENGTH) {
          newErrors.notes = `Pet notes must be ${MAX_PET_NOTES_LENGTH} characters or fewer`;
        } else {
          delete newErrors.notes;
        }
        break;
        
      case "sex":
        if (!value) newErrors.sex = "Gender is required";
        else delete newErrors.sex;
        break;
        
      case "weight":
        if (!value) {
          newErrors.weight = "Weight is required";
        } else if (!/^\d{1,2}$/.test(String(value))) {
          newErrors.weight = "Weight must be a 1-2 digit number (1-99)";
        } else {
          const weight = Number.parseInt(value, 10);
          if (isNaN(weight) || weight <= 0) {
            newErrors.weight = "Weight must be a positive number";
          } else {
            delete newErrors.weight;
          }
        }
        break;
        
      case "color":
        if (value && !/^[a-zA-Z\s]+$/.test(value.trim())) {
          newErrors.color = "Color can only contain letters and spaces";
        } else {
          delete newErrors.color;
        }
        break;
        
      case "dob":
        if (!value) {
          newErrors.dob = "Date of birth is required";
        } else {
          const dobDate = new Date(value);
          const today = new Date();
          if (dobDate > today) {
            newErrors.dob = "Date of birth cannot be in the future";
          } else {
            delete newErrors.dob;
          }
        }
        break;
        
      default:
        break;
    }
    
    setErrors(newErrors);
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!petData.ownerId) nextErrors.ownerId = "Owner is required";
    if (!petData.type) nextErrors.type = "Pet type is required";
    if (!petData.breed) {
      nextErrors.breed = "Breed is required";
    } else if (petData.breed === "other" && !petData.customBreed?.trim()) {
      nextErrors.breed = "Please enter a custom breed name";
    }

    const normalizedName = String(petData.name || "").trim();
    if (!normalizedName) {
      nextErrors.name = "Pet name is required";
    } else if (normalizedName.length < 2) {
      nextErrors.name = "Pet name must be at least 2 characters";
    } else if (normalizedName.length > MAX_PET_NAME_LENGTH) {
      nextErrors.name = `Pet name must be ${MAX_PET_NAME_LENGTH} characters or fewer`;
    } else if (!/^[\p{L}\s]+$/u.test(normalizedName)) {
      nextErrors.name = "Pet name can only contain letters and spaces";
    }

    if (String(petData.notes || "").trim().length > MAX_PET_NOTES_LENGTH) {
      nextErrors.notes = `Pet notes must be ${MAX_PET_NOTES_LENGTH} characters or fewer`;
    }

    if (!petData.sex) nextErrors.sex = "Gender is required";

    if (!petData.weight) {
      nextErrors.weight = "Weight is required";
    } else if (!/^\d{1,2}$/.test(String(petData.weight))) {
      nextErrors.weight = "Weight must be a 1-2 digit number (1-99)";
    } else {
      const weight = Number.parseInt(petData.weight, 10);
      if (Number.isNaN(weight) || weight <= 0) {
        nextErrors.weight = "Weight must be a positive number";
      }
    }

    if (petData.color && !/^[\p{L}\s]+$/u.test(String(petData.color).trim())) {
      nextErrors.color = "Color can only contain letters and spaces";
    }

    if (!petData.dob) {
      nextErrors.dob = "Date of birth is required";
    } else {
      const dobDate = new Date(petData.dob);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dobDate > today) {
        nextErrors.dob = "Date of birth cannot be in the future";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  // Fetch species (Type)
  useEffect(() => {
    const fetchSpecies = async () => {
      try {
        const res = await api.get("/admin/species");
        setSpeciesOptions(res.data);
      } catch (err) {
        console.error("Failed to fetch species:", err);
        setSpeciesOptions([]);
      }
    };
    fetchSpecies();
  }, []);

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
      return;
    }

    if (initialData) {
      
      const ownerId = owners.find((o) => o.name === initialData.owner)?.id || "";
      
      setPetData({
        ownerId: initialData.accID || ownerId,
        type: initialData.petType || "",
        breed: initialData.breed || "",
        name: initialData.name || "",
        age: initialData.age || "",
        sex: initialData.gender || "",
        weight: sanitizeNumber(initialData.weight),
        color: initialData.color || "",
        dob: toInputDate(initialData.petDateOfBirth),
        notes: initialData.note || "",
      });
    } else {
      resetForm();
    }
  }, [initialData, isOpen, owners]);

  // Fetch breeds whenever petData.type changes
  useEffect(() => {
    if (!petData.type) {
      setBreeds([]);
      return;
    }

    const fetchBreeds = async () => {
      try {
        const res = await api.get(`/admin/breeds?species=${petData.type}`);
        setBreeds(
          (Array.isArray(res.data) ? res.data : [])
            .map((breed) => breed?.breedName ?? breed)
            .filter(Boolean)
        );
      } catch (error) {
        console.error("Failed to fetch breeds:", error);
        setBreeds([]);
      }
    };

    fetchBreeds();
  }, [petData.type]);

  const handleChange = (field, value) => {
    if (field === "weight") {
      value = sanitizeNumber(value);
    }

    if (field === "name") {
      value = String(value || "").slice(0, MAX_PET_NAME_LENGTH);
    }

    if (field === "notes") {
      value = String(value || "").slice(0, MAX_PET_NOTES_LENGTH);
    }

    const updated = { ...petData, [field]: value };
    if (field === "type") {
      updated.breed = ""; // Reset breed when type changes
      updated.customBreed = ""; // Reset custom breed when type changes
      setBreeds([]); // Clear breeds temporarily
    }
    if (field === "breed" && value !== "other") {
      updated.customBreed = ""; // Clear custom breed when selecting predefined breed
    }
    setPetData(updated);
    setApiError("");
    
    // Validate field in real-time
    validateField(field, value);
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return; // Don't proceed if validation fails
    }

    setIsLoading(true);
    
    try {
      // Use custom breed if "other" is selected
      const finalBreed = petData.breed === "other" ? petData.customBreed : petData.breed;
      const dataToSave = { ...petData, breed: finalBreed };
      
      // For editing existing pet
      if (initialData) {
        const res = await api.put(`/admin/update-pet/${initialData.id}`, { 
          ...dataToSave,
          type: dataToSave.type
        });
      } else {
        // For adding new pet
        const res = await api.post("/admin/add-pets", { 
          ...dataToSave,
          type: dataToSave.type
        });

        onSave({
          ...dataToSave,
          id: res.data?.petId || Date.now(),
          owner: owners.find(o => o.id === Number(petData.ownerId))?.name || ""
        });
      }

      if (initialData) {
        onSave({
          ...dataToSave,
          id: initialData?.id || Date.now(),
          owner: owners.find(o => o.id === Number(petData.ownerId))?.name || ""
        });
      }

      resetForm();
      onClose();
      
      if (refreshPets) {
        refreshPets();
      }
    } catch (err) {
      console.error("Error saving pet:", err);
      setApiError(err?.response?.data?.message || "Failed to save pet.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setPetData({
      ownerId: "",
      type: "",
      breed: "",
      customBreed: "",
      name: "",
      age: "",
      sex: "",
      weight: "",
      color: "",
      dob: "",
      notes: "",
    });
    setOwnerSearch("");
    setBreeds([]);
    setErrors({});
    setApiError("");
  };

  useEffect(() => {
    if (!isOpen || initialData || !defaultOwnerId) return;
    setPetData((prev) => ({ ...prev, ownerId: Number(defaultOwnerId) }));
  }, [defaultOwnerId, initialData, isOpen]);

  if (!isOpen) return null;

  const filteredOwners = owners.filter(
    (o) =>
      o.name.toLowerCase().includes(ownerSearch.toLowerCase()) ||
      o.email.toLowerCase().includes(ownerSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-[#F5F7FA] dark:bg-[#1C1C1E] w-[820px] rounded-2xl shadow-2xl p-5 flex flex-col relative max-h-[90vh] box-border">
        {/* Close */}
        <button
          onClick={() => {
            resetForm();
            onClose();
          }}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition"
        >
          <X size={26} />
        </button>

        <h2 className="text-2xl font-bold text-[#212529] dark:text-white mb-5 text-center">
          {initialData ? "Edit Pet" : "Add New Pet"}
        </h2>

        {apiError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 flex items-center gap-2">
            <AlertCircle size={14} />
            <span>{apiError}</span>
          </div>
        )}

        <div className="flex gap-4 flex-1 min-h-0">
          {/* Left: Owner selection */}
          <div className={`flex-1 bg-white dark:bg-[#252525] p-4 rounded-xl flex flex-col gap-3 min-h-0 overflow-y-auto ${lockOwnerSelection ? "hidden" : ""}`}>
            <h3 className="font-semibold text-[#212529] dark:text-white mb-2 text-base">Select Owner *</h3>
            <div className="relative mb-2">
              <Search className="absolute top-3 left-3 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={ownerSearch}
                onChange={(e) => setOwnerSearch(e.target.value)}
                disabled={lockOwnerSelection}
                className="w-full pl-10 p-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#252525] text-gray-800 dark:text-gray-200 text-sm focus:border-[#5EE6FE] focus:ring-1 focus:ring-[#5EE6FE] transition"
              />
            </div>
            <div className="flex-1">
              {filteredOwners.length ? (
                filteredOwners.map((owner) => (
                  <div
                    key={owner.id}
                    onClick={() => !lockOwnerSelection && handleChange("ownerId", owner.id)}
                    className={`p-2 cursor-pointer rounded-md ${
                      petData.ownerId === owner.id
                        ? "bg-[#5EE6FE]/30 dark:bg-[#5EE6FE]/50"
                        : "hover:bg-[#5EE6FE]/20 dark:hover:bg-[#5EE6FE]/30"
                    }`}
                  >
                    <p className="font-medium text-sm">{owner.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-300">{owner.email}</p>
                  </div>
                ))
              ) : (
                <p className="p-2 text-gray-400 text-sm">No owner found</p>
              )}
            </div>
            {errors.ownerId && (
              <p className="text-red-500 text-xs flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.ownerId}
              </p>
            )}
          </div>

          {/* Right: Pet details */}
          <div className="flex-1 bg-white dark:bg-[#252525] p-4 rounded-xl flex flex-col gap-2 justify-between min-h-0 overflow-y-auto">
            <h3 className="font-semibold text-[#212529] dark:text-white text-base">Pet Details</h3>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {/* Type - Required */}
              <div>
                <label className="block mb-1">Type *</label>
                <select
                  value={petData.type}
                  onChange={e => handleChange("type", e.target.value)}
                  className={`w-full p-2 rounded-xl border ${
                    errors.type ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-[#252525] text-gray-800 dark:text-gray-200 focus:border-[#5EE6FE] focus:ring-1 focus:ring-[#5EE6FE] transition`}
                >
                  <option value="">Select Type</option>
                  {speciesOptions.map((s, i) => (
                    <option key={i} value={s}>{s}</option>
                  ))}
                </select>
                {errors.type && (
                  <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                    <AlertCircle size={12} />
                    {errors.type}
                  </p>
                )}
              </div>

              {/* Breed - Required */}
              <div>
                <label className="block mb-1">Breed *</label>
                <select
                  value={petData.breed}
                  onChange={(e) => handleChange("breed", e.target.value)}
                  disabled={!petData.type}
                  className={`w-full p-2 rounded-xl border ${
                    errors.breed ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-[#252525] text-gray-800 dark:text-gray-200 focus:border-[#5EE6FE] focus:ring-1 focus:ring-[#5EE6FE] transition`}
                >
                  <option value="">Select Breed</option>
                  {breeds.map((b, i) => (
                    <option key={i} value={b}>{b}</option>
                  ))}
                  <option value="other">Other</option>
                </select>
                {errors.breed && (
                  <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                    <AlertCircle size={12} />
                    {errors.breed}
                  </p>
                )}
              </div>

              {/* Custom Breed Input - Show when "Other" is selected */}
              {petData.breed === "other" && (
                <div className="col-span-2">
                  <label className="block mb-1">Enter Custom Breed *</label>
                  <input
                    type="text"
                    value={petData.customBreed}
                    onChange={(e) => {
                      const updated = { ...petData, customBreed: e.target.value };
                      setPetData(updated);
                      validateField("breed", petData.breed);
                    }}
                    placeholder="Enter the breed name..."
                    className={`w-full p-2 rounded-xl border ${
                      errors.breed ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-[#252525] text-gray-800 dark:text-gray-200 focus:border-[#5EE6FE] focus:ring-1 focus:ring-[#5EE6FE] transition`}
                  />
                  {errors.breed && errors.breed.includes("custom") && (
                    <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                      <AlertCircle size={12} />
                      {errors.breed}
                    </p>
                  )}
                </div>
              )}

              {/* Name - Required */}
              <div className="col-span-2">
                <label className="block mb-1">Name *</label>
                <input
                  type="text"
                  value={petData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  maxLength={MAX_PET_NAME_LENGTH}
                  placeholder="Pet Name"
                  className={`w-full p-2 rounded-xl border ${
                    errors.name ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-[#252525] text-gray-800 dark:text-gray-200 focus:border-[#5EE6FE] focus:ring-1 focus:ring-[#5EE6FE] transition`}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                    <AlertCircle size={12} />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Sex - Required */}
              <div>
                <label className="block mb-1">Sex *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="sex"
                      value="Male"
                      checked={petData.sex === "Male"}
                      onChange={(e) => handleChange("sex", e.target.value)}
                      className="w-4 h-4 text-[#5EE6FE] focus:ring-[#5EE6FE]"
                    />
                    <span className="text-sm text-gray-800 dark:text-gray-200">Male</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="sex"
                      value="Female"
                      checked={petData.sex === "Female"}
                      onChange={(e) => handleChange("sex", e.target.value)}
                      className="w-4 h-4 text-[#5EE6FE] focus:ring-[#5EE6FE]"
                    />
                    <span className="text-sm text-gray-800 dark:text-gray-200">Female</span>
                  </label>
                </div>
                {errors.sex && (
                  <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                    <AlertCircle size={12} />
                    {errors.sex}
                  </p>
                )}
              </div>

              {/* Weight - Required */}
              <div>
                <label className="block mb-1">Weight (kg) *</label>
                <input
                  type="text"
                  value={petData.weight}
                  onChange={(e) => handleChange("weight", e.target.value)}
                  inputMode="numeric"
                  maxLength={2}
                  placeholder="Weight"
                  className={`w-full p-2 rounded-xl border ${
                    errors.weight ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-[#252525] text-gray-800 dark:text-gray-200 focus:border-[#5EE6FE] focus:ring-1 focus:ring-[#5EE6FE] transition`}
                />
                {errors.weight && (
                  <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                    <AlertCircle size={12} />
                    {errors.weight}
                  </p>
                )}
              </div>

              {/* Color - Optional */}
              <div>
                <label className="block mb-1">Color</label>
                <input
                  type="text"
                  value={petData.color}
                  onChange={(e) => handleChange("color", e.target.value)}
                  placeholder="Color"
                  className={`w-full p-2 rounded-xl border ${
                    errors.color ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-[#252525] text-gray-800 dark:text-gray-200 focus:border-[#5EE6FE] focus:ring-1 focus:ring-[#5EE6FE] transition`}
                />
                {errors.color && (
                  <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                    <AlertCircle size={12} />
                    {errors.color}
                  </p>
                )}
              </div>

              {/* Date of Birth - Required */}
              <div>
                <label className="block mb-1">Date of Birth *</label>
                <input
                  type="date"
                  value={petData.dob}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => handleChange("dob", e.target.value)}
                  className={`w-full p-2 rounded-xl border ${
                    errors.dob ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-[#252525] text-gray-800 dark:text-gray-200 focus:border-[#5EE6FE] focus:ring-1 focus:ring-[#5EE6FE] transition`}
                />
                {errors.dob && (
                  <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                    <AlertCircle size={12} />
                    {errors.dob}
                  </p>
                )}
              </div>

              {/* Notes - Optional */}
              <div className="col-span-2">
                <label className="block mb-1">Notes (optional)</label>
                <textarea
                  value={petData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  maxLength={MAX_PET_NOTES_LENGTH}
                  placeholder="Additional notes..."
                  className="w-full p-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#252525] text-gray-800 dark:text-gray-200 focus:border-[#5EE6FE] focus:ring-1 focus:ring-[#5EE6FE] transition resize-none"
                />
                <p className="text-xs text-gray-500 text-right">{petData.notes.length}/{MAX_PET_NOTES_LENGTH}</p>
                {errors.notes && (
                  <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                    <AlertCircle size={12} />
                    {errors.notes}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#222] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg bg-[#5EE6FE] hover:bg-[#40c6e3] text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Saving..." : (initialData ? "Update Pet" : "Save Pet")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPetModal;

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios"; 
import { PlusCircle } from "lucide-react";
import Header from "../components/template/Header";
import AddOwnerModal from "../components/petpatient-management/AddOwnerModal";
import AddPetModal from "../components/petpatient-management/AddPetModal";
import SuccessToast from "../components/template/SuccessToast.jsx";
import ErrorToast from "../components/template/ErrorToast.jsx";
import socket from "../socket";
import { buildMediaUrl } from "../utils/runtimeUrls";
import PetOwnersTab from "../components/petpatient-management/PetOwnersTab";
import PetsTab from "../components/petpatient-management/PetsTab";
import RecordsTab from "../components/petpatient-management/RecordsTab";
import RightPanel from "../components/petpatient-management/RightPanel";
import DeleteModal from "../components/petpatient-management/DeleteModal";
import UploadRecordModal from "../components/petpatient-management/UploadRecordModal";
import PdfModal from "../components/petpatient-management/PdfModal";
import FilterSort from "../components/petpatient-management/FilterSort";

const resolveAdminPetImage = (pet) => {
  if (!pet) return "/images/sad-dog.png";

  if (pet.imageUrl && /^https?:\/\//i.test(pet.imageUrl)) {
    return pet.imageUrl;
  }

  if (pet.imageName && /^https?:\/\//i.test(pet.imageName)) {
    return pet.imageName;
  }

  if (pet.imageName) {
    return buildMediaUrl(`/api/pets/images/${encodeURIComponent(pet.imageName)}`);
  }

  return "/images/sad-dog.png";
};

const isRecordUploaded = (record) => {
  if (typeof record?.isUploaded === 'boolean') return record.isUploaded;
  if (typeof record?.isUploaded === 'number') return record.isUploaded === 1;
  if (typeof record?.isUploaded === 'string') {
    const normalized = record.isUploaded.trim().toLowerCase();
    if (normalized === '1' || normalized === 'true' || normalized === 'uploaded') return true;
    if (normalized === '0' || normalized === 'false' || normalized === 'draft') return false;
  }
  if (typeof record?.recordStatus === 'string') return record.recordStatus.trim().toLowerCase() === 'uploaded';
  return Boolean(record?.fileName || record?.storedName || record?.filePath || record?.originalName || record?.uploadedOn);
};

const PetPatientManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Pet Owners");
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [selectedPet, setSelectedPet] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddPetModalOpen, setIsAddPetModalOpen] = useState(false);
  const [isAddOwnerModalOpen, setIsAddOwnerModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showUploadRecordModal, setShowUploadRecordModal] = useState(false);
  const fileInputRef = useRef(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [petOwners, setPetOwners] = useState([]);
  const [pets, setPets] = useState([]);
  const [records, setRecords] = useState([]);

  // Check if user is veterinarian (role 3)
  const [isVet, setIsVet] = useState(false);

  // Filter and Sort State
  const [filterSort, setFilterSort] = useState({
    petOwners: { sort: "desc", nameSort: null },
    pets: { species: null, nameSort: "pet-name-asc", dateSort: null },
    records: { type: null, status: null, dateSort: null }
  });

  useEffect(() => {
    // Check user role from localStorage or API
    const userRole = localStorage.getItem('userRole') || 2; // Default to admin if not found
    setIsVet(userRole === '3');
    
    // Load initial data
    fetchOwnersAndPets();
    fetchMedicalRecords();
  }, []);

  useEffect(() => {
    const userId = localStorage.getItem("userId");

    const joinRoom = () => {
      if (userId) {
        socket.emit("join", userId);
      }
    };

    if (!socket.connected) {
      socket.connect();
    } else {
      joinRoom();
    }

    socket.on("connect", joinRoom);

    const handleOwnerUpdated = () => {
      fetchOwnersAndPets();
    };

    socket.on("owner_updated", handleOwnerUpdated);
    socket.on("owner_profile_updated", handleOwnerUpdated);

    return () => {
      socket.off("connect", joinRoom);
      socket.off("owner_updated", handleOwnerUpdated);
      socket.off("owner_profile_updated", handleOwnerUpdated);
    };
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric"
    });
  };
  
  const calculateAge = (dob) => {
    const birth = new Date(dob);
    const today = new Date();

    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    let days = today.getDate() - birth.getDate();

    if (days < 0) {
      months--;
      const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += lastMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    if (years > 0) {
      return `${years} yrs old`;
    } else if (months > 0) {
      return `${months} mos old`;
    } else {
      return `${days} days old`;
    }
  };

  // Filter and Sort Handlers
  const handleFilterChange = (filterKey, value) => {
    if (activeTab === "Pet Owners") {
      // Not applicable
    } else if (activeTab === "Pets") {
      setFilterSort(prev => ({
        ...prev,
        pets: { ...prev.pets, [filterKey]: value }
      }));
    } else if (activeTab === "Lab/Medical Records") {
      setFilterSort(prev => ({
        ...prev,
        records: { ...prev.records, [filterKey]: value }
      }));
    }
  };

  const handleSortChange = (value) => {
    if (activeTab === "Pet Owners") {
      // Handle date sort and name sort
      if (value === "desc" || value === "asc") {
        setFilterSort(prev => ({
          ...prev,
          petOwners: { ...prev.petOwners, sort: value }
        }));
      } else if (value.startsWith("name-")) {
        setFilterSort(prev => ({
          ...prev,
          petOwners: { ...prev.petOwners, nameSort: value }
        }));
      }
    } else if (activeTab === "Pets") {
      if (value.startsWith("pet-name-")) {
        setFilterSort(prev => ({
          ...prev,
          pets: { ...prev.pets, nameSort: value }
        }));
      } else if (value.startsWith("pet-date-")) {
        const sortDirection = value === "pet-date-asc" ? "asc" : "desc";
        setFilterSort(prev => ({
          ...prev,
          pets: { ...prev.pets, dateSort: sortDirection }
        }));
      }
    } else if (activeTab === "Lab/Medical Records") {
      if (value.startsWith("record-date-")) {
        const sortDirection = value === "record-date-asc" ? "asc" : "desc";
        setFilterSort(prev => ({
          ...prev,
          records: { ...prev.records, dateSort: sortDirection }
        }));
      }
    }
  };

  // Apply Filters and Sorting
  const applyPetOwnerSort = (owners) => {
    const sorted = [...owners];
    
    // Apply name sort if active
    if (filterSort.petOwners.nameSort === "name-asc") {
      sorted.sort((a, b) => a.name.localeCompare(b.name)); // A-Z
    } else if (filterSort.petOwners.nameSort === "name-desc") {
      sorted.sort((a, b) => b.name.localeCompare(a.name)); // Z-A
    } else {
      // Apply date sort
      if (filterSort.petOwners.sort === "desc") {
        sorted.sort((a, b) => {
          const dateA = new Date(a.createdAt) || 0;
          const dateB = new Date(b.createdAt) || 0;
          return dateB - dateA; // Newest first
        });
      } else {
        sorted.sort((a, b) => {
          const dateA = new Date(a.createdAt) || 0;
          const dateB = new Date(b.createdAt) || 0;
          return dateA - dateB; // Oldest first
        });
      }
    }
    return sorted;
  };

  const applyPetsFilterSort = (petsList) => {
    let filtered = petsList;

    // Apply species filter
    if (filterSort.pets.species) {
      filtered = filtered.filter(pet => pet.petType === filterSort.pets.species);
    }

    // Apply sort
    const sorted = [...filtered];
    
    // Check if we should sort by date or by name
    if (filterSort.pets.dateSort) {
      // Sort by dateOfBirth (pet's date of birth)
      sorted.sort((a, b) => {
        const dateA = new Date(a.dateOfBirth) || new Date(0);
        const dateB = new Date(b.dateOfBirth) || new Date(0);
        return filterSort.pets.dateSort === "asc" ? dateA - dateB : dateB - dateA;
      });
    } else {
      // Sort by name
      if (filterSort.pets.nameSort === "pet-name-desc") {
        sorted.sort((a, b) => b.name.localeCompare(a.name)); // Z-A
      } else {
        sorted.sort((a, b) => a.name.localeCompare(b.name)); // A-Z
      }
    }
    return sorted;
  };

  const applyRecordsFilterSort = (recordsList) => {
    let filtered = recordsList;

    // Apply type filter
    if (filterSort.records.type) {
      filtered = filtered.filter(record => {
        if (!record.type) return false;
        const recordType = record.type.trim().toLowerCase();
        const filterType = filterSort.records.type.trim().toLowerCase();
        // Match exact text or check if the record type contains the filter term
        return recordType === filterType || recordType.includes(filterType);
      });
    }

    // Apply status filter
    if (filterSort.records.status) {
      filtered = filtered.filter(record => {
        const isUploaded = isRecordUploaded(record);
        if (filterSort.records.status === "uploaded") {
          return isUploaded;
        } else if (filterSort.records.status === "drafted") {
          return !isUploaded;
        }
        return true;
      });
    }

    // Apply date sort if specified
    if (filterSort.records.dateSort) {
      filtered.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.uploadedOn || 0);
        const dateB = new Date(b.createdAt || b.uploadedOn || 0);
        return filterSort.records.dateSort === "asc" ? dateA - dateB : dateB - dateA;
      });
    }

    return filtered;
  };

  // Fetch medical records from backend
  const fetchMedicalRecords = async () => {
    try {
      const response = await api.get("/admin/pet-records/lab-records");
      if (response.data.success) {
        setRecords(response.data.data);
        
        // If we have a selected record, update it with fresh data
        if (selectedRecord) {
          const updatedRecord = response.data.data.find(record => record.id === selectedRecord.id);
          if (updatedRecord) {
            setSelectedRecord(updatedRecord);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching medical records:", error);
      setErrorMessage("Failed to load medical records");
    }
  };

  // NEW: Function to update selected record when it's edited
  const handleRecordUpdate = (updatedRecord) => {
    setSelectedRecord(updatedRecord);
    // Also update the records list
    setRecords(prev => prev.map(record => 
      record.id === updatedRecord.id ? updatedRecord : record
    ));
  };

  const fetchOwnersAndPets = async () => {
    try {
      const res = await api.get("/admin/owners-with-pets");
      const data = res.data;

      setPetOwners(
        data.map(o => ({
          id: o.accId,
          name: o.name,
          firstName: o.firstName,
          lastName: o.lastName,
          gender: o.gender,
          dateOfBirth: formatDate(o.dateOfBirth),
          email: o.email,
          phone: o.contactNo,
          address: o.address,
          createdAt: formatDate(o.createdAt),
          pets: o.pets
        }))
      );

      setPets(
        data.flatMap(owner =>
          (owner.pets || []).map(p => ({
            id: p.petID,
            petID: p.petID, // Add petID for medical records
            name: p.petName,
            petName: p.petName,
            petType: p.petType,
            species: p.petType,
            gender: p.petGender,
            breed: p.breedName,
            age: calculateAge(p.dateOfBirth),
            dateOfBirth: p.dateOfBirth,
            dob: p.dateOfBirth,
            petDateOfBirth: formatDate(p.dateOfBirth),
            weight: (p.weight_kg ?? 0) + " kg",
            color: p.color,
            note: p.note,
            owner: owner.name,
            accID: owner.id, // Add accID for medical records
            image: resolveAdminPetImage(p),
            imageName: p.imageName || "",
            imageUrl: p.imageUrl || ""
          }))
        )
      );
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to load owners and pets");
    }
  };

  const handleEditRecord = (record) => {
    if (isRecordUploaded(record)) {
      setErrorMessage('Uploaded records cannot be edited.');
      return;
    }

    // Set the selected record and open preview modal
    setSelectedRecord(record);
    setIsPdfModalOpen(true);
  };

  const proceedToEditRecord = (record) => {
    const resolvedPetId = record?.petID;
    const resolvedPetName = record?.petName || "Pet";

    if (!resolvedPetId) {
      setErrorMessage("Unable to open document editor: missing pet ID.");
      return;
    }

    navigate(`/admin/create-lab-document/${resolvedPetId}/${encodeURIComponent(resolvedPetName)}`, {
      state: {
        petMedicalID: record.id,
        recordTitle: record.recordTitle,
        labTypeID: record.labTypeID,
        recordStatus: record.recordStatus,
        editorHtml: record.editorHtml || "",
        ownerName: record.owner || "N/A"
      }
    });
  };

  const handleDeleteRecordClick = (record) => {
    setDeleteTarget({ type: "record", id: record.id });
    setShowDeleteModal(true);
  };

  // Handle medical record deletion
  const handleDeleteRecord = async (recordId) => {
    try {
      
      const response = await api.delete(`/admin/pet-records/${recordId}`);
      
      
      // Even if the response says "not found", if we got a 200 status, consider it successful
      if (response.status === 200 || response.status === 204) {
        setSuccessMessage("Medical record deleted successfully!");
        // Clear selected record if it was the one deleted
        if (selectedRecord && selectedRecord.id === recordId) {
          setSelectedRecord(null);
        }
        fetchMedicalRecords(); // Refresh the records list
      } else if (response.data.success) {
        setSuccessMessage("Medical record deleted successfully!");
        if (selectedRecord && selectedRecord.id === recordId) {
          setSelectedRecord(null);
        }
        fetchMedicalRecords();
      }
    } catch (error) {
      console.error("❌ Error deleting medical record:", error);
      console.error("Error status:", error.response?.status);
      console.error("Error data:", error.response?.data);
      
      // If it's a 404 but the record was actually deleted, treat it as success
      if (error.response?.status === 404) {
        setSuccessMessage("Medical record deleted successfully!");
        if (selectedRecord && selectedRecord.id === recordId) {
          setSelectedRecord(null);
        }
        fetchMedicalRecords();
      } else {
        setErrorMessage("Failed to delete medical record");
      }
    }
  };

  const filteredOwners = applyPetOwnerSort(
    petOwners.filter(o =>
      o.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const filteredPets = applyPetsFilterSort(
    pets.filter(p =>
      p.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const filteredRecords = applyRecordsFilterSort(
    records.filter(r =>
      r.petName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.owner?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleDelete = async (id, type) => {
    try {
      if (type === "owner") {
        setPetOwners(prev => prev.filter(o => o.id !== id));
        if (selectedOwner?.id === id) setSelectedOwner(null);
        setSuccessMessage("Owner deleted successfully!");
      } else if (type === "pet") {
        setPets(prev => prev.filter(p => p.id !== id));
        if (selectedPet?.id === id) setSelectedPet(null);
        setSuccessMessage("Pet deleted successfully!");
      } else if (type === "record") {
        await handleDeleteRecord(id);
      }
    } catch {
      setErrorMessage("Failed to delete!");
    }
  };

  const handleEdit = (item, type) => {
    if (type === "pet") {
      setEditingItem(item);
      setIsAddPetModalOpen(true);
    } else if (type === "owner") {
      setEditingItem({ ...item, type });
      setIsAddOwnerModalOpen(true);
    }
  };

  const handleSaveOwner = async (newData) => {
    try {
      if (editingItem) {
        const res = await api.put(`/admin/update-owner/${editingItem.id}`, newData);

        const updatedOwner = {
          ...editingItem,
          ...newData,
          name: `${newData.firstName} ${newData.lastName}`,
          email: newData.email,
          phone: newData.phone,
          address: newData.address,
          gender: newData.sex,
          dateOfBirth: formatDate(newData.dob),
        };

        setPetOwners(prev =>
          prev.map(o => o.id === editingItem.id ? updatedOwner : o)
        );
        
        if (selectedOwner && selectedOwner.id === editingItem.id) {
          setSelectedOwner(updatedOwner);
        }
        
        setEditingItem(null);
        setSuccessMessage("Owner updated successfully!");
        
        await fetchOwnersAndPets();
        
        return { message: "Owner updated successfully" };
        
      } else {
        const res = await api.post("/admin/add-owner", newData);

        setSuccessMessage(`Account created and credentials were sent to ${newData.email}.`);
        
        await fetchOwnersAndPets();

        return {
          email: res.data.email,
          password: res.data.password
        };
      }
    } catch (error) {
      console.error("Error saving owner:", error);
      throw error;
    }
  };

  const handleSavePet = (savedPet) => {
    try {
      if (editingItem) {
        const updatedPet = {
          id: editingItem.id,
          name: savedPet.name || editingItem.name,
          petType: savedPet.type || editingItem.petType,
          breed: savedPet.breed || editingItem.breed,
          gender: savedPet.sex || editingItem.gender,
          age: savedPet.dob ? calculateAge(savedPet.dob) : editingItem.age,
          petDateOfBirth: savedPet.dob ? formatDate(savedPet.dob) : editingItem.petDateOfBirth,
          weight: savedPet.weight ? `${savedPet.weight} kg` : editingItem.weight,
          color: savedPet.color || editingItem.color,
          note: savedPet.notes || editingItem.note,
          owner: editingItem.owner,
          image: editingItem.image || "/images/sad-dog.png"
        };

        setPets(prev => prev.map(p => p.id === editingItem.id ? updatedPet : p));
        
        if (selectedPet && selectedPet.id === editingItem.id) {
          setSelectedPet(updatedPet);
        }
        
        setEditingItem(null);
        setSuccessMessage("Pet updated successfully!");
      } else {
        const ownerName = petOwners.find(o => o.id === parseInt(savedPet.ownerId))?.name || "";
        const newPet = {
          id: pets.length ? Math.max(...pets.map(p => p.id)) + 1 : 1,
          name: savedPet.name,
          petType: savedPet.type,
          breed: savedPet.breed,
          gender: savedPet.sex,
          age: savedPet.dob ? calculateAge(savedPet.dob) : "",
          petDateOfBirth: savedPet.dob ? formatDate(savedPet.dob) : "",
          weight: savedPet.weight ? `${savedPet.weight} kg` : "",
          color: savedPet.color,
          note: savedPet.notes,
          owner: ownerName,
          image: "/images/sad-dog.png"
        };
        
        setPets(prev => [...prev, newPet]);
        setSuccessMessage("Pet added successfully!");
      }
    } catch {
      setErrorMessage("Failed to save pet!");
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedOwner(null);
    setSelectedPet(null);
    setSelectedRecord(null);
    setSearchQuery("");
    
    // Refresh records when switching to Lab/Medical Records tab
    if (tab === "Lab/Medical Records") {
      fetchMedicalRecords();
    }
  };

  const handleAddButtonClick = () => {
    setEditingItem(null);
    if (activeTab === "Pet Owners") setIsAddOwnerModalOpen(true);
    else if (activeTab === "Pets") setIsAddPetModalOpen(true);
    else if (activeTab === "Lab/Medical Records") setShowUploadRecordModal(true);
  };

  const getAddButtonText = () => {
    switch (activeTab) {
      case "Pet Owners": return "Add Owner";
      case "Pets": return "Add Pet";
      case "Lab/Medical Records": return "Add Record";
      default: return "Add";
    }
  };

  const getSearchPlaceholder = () => {
    switch (activeTab) {
      case "Pet Owners": return "Search owners...";
      case "Pets": return "Search pets...";
      case "Lab/Medical Records": return "Search records...";
      default: return "Search...";
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#FBFBFB] dark:bg-[#101010] p-4 gap-4 relative">
      <Header title="Customer & Pet Management" />

      {/* Toasts */}
      {successMessage && (
        <SuccessToast message={successMessage} duration={3000} onClose={() => setSuccessMessage(null)} />
      )}
      {errorMessage && (
        <ErrorToast message={errorMessage} duration={3000} onClose={() => setErrorMessage(null)} />
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 relative">
        {["Pet Owners", "Pets", "Lab/Medical Records"].map(tab => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`relative px-5 py-2 font-semibold text-md transition-colors ${
              activeTab === tab
                ? "text-[#A9E6FF]"
                : "text-gray-600 dark:text-gray-300 hover:text-[#A9E6FF] dark:hover:text-[#3BAFDA]"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 w-full h-1 bg-[#5EE6FE] dark:bg-[#3BAFDA] rounded-t-lg" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Main Tables */}
        <div className="flex flex-col flex-1 bg-white dark:bg-[#181818] rounded-2xl shadow-md border border-gray-100 dark:border-gray-800 p-4 min-h-0">
          {/* Search and Add Button Row */}
          <div className="flex items-center mb-4 gap-2">
            <input
              type="text"
              placeholder={getSearchPlaceholder()}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="p-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1B1B1B] text-gray-800 dark:text-gray-200 w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-[#5EE6FE]/50"
            />

            {/* Hide Add button for veterinarians */}
            {!isVet && (
              <button
                className="ml-auto flex items-center gap-2 bg-[#5EE6FE] hover:bg-[#40c6e3] text-white px-3 py-2 rounded-lg transition"
                onClick={handleAddButtonClick}
              >
                <PlusCircle size={16} />
                <span className="text-sm font-semibold">
                  {getAddButtonText()}
                </span>
              </button>
            )}
          </div>

          {/* Filter Row - Below Search */}
          <div className="mb-4">
            <FilterSort 
              activeTab={activeTab}
              onFilterChange={handleFilterChange}
              onSortChange={handleSortChange}
              currentFilters={
                activeTab === "Pet Owners" 
                  ? {} 
                  : activeTab === "Pets" 
                  ? filterSort.pets 
                  : filterSort.records
              }
              currentSort={
                activeTab === "Pet Owners" 
                  ? filterSort.petOwners
                  : activeTab === "Pets"
                  ? filterSort.pets
                  : filterSort.records
              }
            />
          </div>

          {/* Render Active Tab */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {activeTab === "Pet Owners" && (
              <PetOwnersTab
                filteredOwners={filteredOwners}
                setSelectedOwner={setSelectedOwner}
                handleEdit={handleEdit}
                setDeleteTarget={setDeleteTarget}
                setShowDeleteModal={setShowDeleteModal}
                isVetView={isVet}
              />
            )}

            {activeTab === "Pets" && (
              <PetsTab
                filteredPets={filteredPets}
                setSelectedPet={setSelectedPet}
                handleEdit={handleEdit}
                setDeleteTarget={setDeleteTarget}
                setShowDeleteModal={setShowDeleteModal}
                isVetView={isVet}
              />
            )}

            {activeTab === "Lab/Medical Records" && (
              <RecordsTab
                records={filteredRecords}
                setSelectedRecord={setSelectedRecord}
                handleEditRecord={handleEditRecord}
                handleDeleteRecordClick={handleDeleteRecordClick}
                isVetView={isVet}
              />
            )}
          </div>
        </div>

        {/* Right Panel Component */}
        <RightPanel
          activeTab={activeTab}
          selectedOwner={selectedOwner}
          selectedPet={selectedPet}
          selectedRecord={selectedRecord}
          setIsPdfModalOpen={setIsPdfModalOpen}
          isVetView={isVet}
        />
      </div>

      {/* Add/Edit Modals - Only show for non-veterinarians */}
      {!isVet && (
        <>
          <AddOwnerModal
            isOpen={isAddOwnerModalOpen}
            onClose={() => { setIsAddOwnerModalOpen(false); setEditingItem(null); }}
            onSave={handleSaveOwner}
            refreshOwners={fetchOwnersAndPets}
            initialData={editingItem?.type === "owner" ? editingItem : null}
          />
          <AddPetModal
            key={editingItem ? editingItem.id : "new"}
            isOpen={isAddPetModalOpen}
            onClose={() => { setIsAddPetModalOpen(false); setEditingItem(null); }}
            onSave={handleSavePet}
            owners={petOwners}
            refreshPets={fetchOwnersAndPets}
            initialData={editingItem}
          />

          {/* Delete Confirmation Modal */}
          {showDeleteModal && (
            <DeleteModal
              isOpen={showDeleteModal}
              onClose={() => {
                setShowDeleteModal(false);
                setDeleteTarget(null);
              }}
              onDelete={handleDelete}
              itemType={deleteTarget?.type === "owner" ? "owner" : deleteTarget?.type === "pet" ? "pet" : "record"}
              deleteTarget={deleteTarget}
              refreshData={deleteTarget?.type === "record" ? fetchMedicalRecords : fetchOwnersAndPets}
            />
          )}

          {/* Upload Record Modal */}
          {showUploadRecordModal && (
            <UploadRecordModal
              isOpen={showUploadRecordModal}
              onClose={() => {
                setShowUploadRecordModal(false);
                setSelectedPet(null);
                setSearchQuery("");
                setEditingItem(null);
              }}
              pets={pets}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedPet={selectedPet}
              setSelectedPet={setSelectedPet}
              setSuccessMessage={setSuccessMessage}
              setErrorMessage={setErrorMessage}
              refreshRecords={fetchMedicalRecords}
              editingItem={editingItem}
              onRecordUpdate={handleRecordUpdate} // NEW: Add this prop
            />
          )}
        </>
      )}

      {/* PDF Modal - Show for both roles */}
      {isPdfModalOpen && selectedRecord && (
        <PdfModal
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
          selectedRecord={selectedRecord}
          onEdit={proceedToEditRecord}
        />
      )}
    </div>
  );
};

export default PetPatientManagement;

// AddAppointment.js
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Search, Calendar, Layers, User, PawPrint, CheckCircle } from "lucide-react";
import { 
  format, 
  isSameMonth, 
  isSameDay, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  addMonths, 
  subMonths, 
  isBefore, 
  startOfDay 
} from 'date-fns';
import SuccessToast from "../components/template/SuccessToast.jsx";
import api from "../api/axios";
import AddOwnerModal from "../components/petpatient-management/AddOwnerModal";
import AddPetModal from "../components/petpatient-management/AddPetModal";
import socket from "../socket";

// Sample existing users data
const sampleUsers = [
  { id: 1, firstName: "Mark", lastName: "Mapili", email: "mark@gmail.com", phone: "09123456789"},
  { id: 2, firstName: "Miguel", lastName: "Rojero", email: "miguel@gmail.com", phone: "09123456788"},
  { id: 3, firstName: "Jordan", lastName: "Frando", email: "jordan@gmail.com", phone: "09123456787"},
  { id: 4, firstName: "Anna", lastName: "Cruz", email: "anna@gmail.com", phone: "09123456786"},
  { id: 5, firstName: "Ella", lastName: "Santos", email: "ella@gmail.com", phone: "09123456785"},
  { id: 6, firstName: "John", lastName: "Doe", email: "john.doe@gmail.com", phone: "09123456784"},
  { id: 7, firstName: "Maria", lastName: "Garcia", email: "maria.garcia@gmail.com", phone: "09123456783"},
  { id: 8, firstName: "Carlos", lastName: "Lopez", email: "carlos.lopez@gmail.com", phone: "09123456782"},
];

// Sample existing pets data
const samplePets = [
  { id: 1, userId: 1, name: "Bogart", type: "Dog", breed: "Chihuahua", age: "3", sex: "Male", weight: "8", color: "Brown", birthDate: "2020-05", notes: "" },
  { id: 2, userId: 2, name: "Tan tan", type: "Dog", breed: "Shih Tzu", age: "2", sex: "Female", weight: "6", color: "White", birthDate: "2021-08", notes: "" },
  { id: 3, userId: 1, name: "Max", type: "Dog", breed: "Golden Retriever", age: "4", sex: "Male", weight: "25", color: "Golden", birthDate: "2019-03", notes: "" },
];

// Service types matching your requirements
const SERVICE_TYPES = [
  { id: "consult", label: "Consultation", note: "General check-up" },
  { id: "surgery", label: "Basic Soft Tissue Surgery", note: "Scheduled procedure" },
  { id: "cbc", label: "Complete Blood Count", note: "Complete blood count" },
  { id: "microchip", label: "Microchipping", note: "Permanent ID implant" },
  { id: "deworm", label: "Deworming", note: "Parasite control" },
  { id: "vax", label: "Vaccination", note: "Routine vaccines" },
  { id: "chem", label: "Blood Chemistry Lab", note: "Detailed panel" },
  { id: "vhc", label: "Veterinary Health Certificate", note: "Travel & export docs" },
  { id: "confinement", label: "Confinement", note: "Overnight observation" },
  { id: "dental", label: "Dental Prophylaxis", note: "Cleaning & check" },
];

const AddAppointment = () => {
  const navigate = useNavigate();
  const isVet = localStorage.getItem("userRole") === "3";
  const appointmentsHomePath = isVet ? "/vet?tab=appointments" : "/admin/appointments";
  const [currentStep, setCurrentStep] = useState(0);
  const [appointmentData, setAppointmentData] = useState({
    user: null,
    pet: null,
    serviceType: "",
    date: "",
    time: "",
    reason: "",
    notes: ""
  });
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [showNewPetForm, setShowNewPetForm] = useState(false);
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [owners, setOwners] = useState([]);
  const [pets, setPets] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);

  // New pet form state (keeping this separate since AddOwnerModal handles client + pet creation)
  const [newPet, setNewPet] = useState({
    name: "",
    type: "",
    breed: "",
    sex: "",
    weight: "",
    color: "",
    birthDate: "",
    notes: ""
  });
  const [newPetErrors, setNewPetErrors] = useState({});

  // Calendar navigation functions
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Generate calendar grid
  const calendar = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const startDate = startOfWeek(start);
    const endDate = endOfWeek(end);
    
    const calendar = [];
    let currentDate = startDate;
    
    while (currentDate <= endDate) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        week.push(currentDate);
        currentDate = addDays(currentDate, 1);
      }
      calendar.push(week);
    }
    
    return calendar;
  }, [currentMonth]);

  // Check if date is in the past
  const isPast = (date) => {
    return isBefore(startOfDay(date), startOfDay(new Date()));
  };

  const parseDisplayTimeToMinutes = (displayTime) => {
    if (!displayTime) return null;
    const [time, meridiem] = displayTime.split(' ');
    if (!time || !meridiem) return null;

    let [hour, minute] = time.split(':').map(Number);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return null;

    const upperMeridiem = meridiem.toUpperCase();
    if (upperMeridiem === 'PM' && hour !== 12) hour += 12;
    if (upperMeridiem === 'AM' && hour === 12) hour = 0;

    return hour * 60 + minute;
  };

  const normalizeArrayResponse = (apiResponse) => {
    if (Array.isArray(apiResponse?.data)) return apiResponse.data;
    if (Array.isArray(apiResponse?.data?.data)) return apiResponse.data.data;
    return [];
  };

  // Fetch time slots and booked slots
  useEffect(() => {
    const fetchTimeSlots = async () => {
      try {
        const res = await api.get("/appointment/time");
        const slots = normalizeArrayResponse(res);
        const formatted = slots
          .map((t) => formatTime(t.scheduleTime || t.startTime || t.time))
          .filter(Boolean);
        setTimeSlots(formatted);
      } catch (err) {
        console.error("❌ Failed to load time slots:", err);
        // Fallback time slots if API fails
        setTimeSlots(["09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM"]);
      }
    };
    fetchTimeSlots();
  }, []);

  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!appointmentData.date) return;
      
      try {
        const res = await api.get(`/appointment/booked-slots?date=${appointmentData.date}`);
        const raw = res?.data;
        const bookedTimes = Array.isArray(raw?.bookedSlots)
          ? raw.bookedSlots.map((slotTime) => formatTime(slotTime))
          : normalizeArrayResponse(res).map((slot) => formatTime(slot.startTime || slot.scheduleTime || slot.time));

        const pastTimes = Array.isArray(raw?.pastSlots)
          ? raw.pastSlots.map((slotTime) => formatTime(slotTime))
          : [];

        const uniqueBlockedTimes = [...new Set([...bookedTimes, ...pastTimes].filter(Boolean))];
        setBookedSlots(uniqueBlockedTimes);
      } catch (err) {
        console.error("❌ Failed to fetch booked slots:", err);
        setBookedSlots([]);
      }
    };

    fetchBookedSlots();
  }, [appointmentData.date]);

  // Time formatting helper
  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const [hour, minute] = timeStr.split(":").map(Number);
    const date = new Date();
    date.setHours(hour);
    date.setMinutes(minute);
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  const fetchOwnersAndPets = async () => {
    try {
      const res = await api.get("/admin/owners-with-pets");
      const data = res.data;

      setOwners(
        data.map(o => ({
          id: o.accId,
          firstName: o.firstName,
          lastName: o.lastName,
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
            userId: p.accID ?? owner.accId ?? owner.id,
            name: p.petName,
            type: p.petType,
            gender: p.petGender,
            breed: p.breedName,
            age: calculateAge(p.dateOfBirth),
            birthDate: formatDate(p.dateOfBirth),
            sex: p.petGender,
            weight: (p.weight_kg ?? 0) + " kg",
            color: p.color,
            notes: p.note,
          }))
        )
      );
    } catch (err) {
      console.error(err);
      setOwners(sampleUsers);
      setPets(samplePets);
    }
  };

  useEffect(() => {
    fetchOwnersAndPets();
  }, []);

  useEffect(() => {
    const joinRoom = () => {
      const userId = localStorage.getItem("userId");
      if (userId) socket.emit("join", userId);
    };

    if (!socket.connected) {
      socket.connect();
    } else {
      joinRoom();
    }

    socket.on("connect", joinRoom);

    const refreshOwnersPets = () => {
      fetchOwnersAndPets();
    };

    socket.on("owner_created", refreshOwnersPets);
    socket.on("pet_created", refreshOwnersPets);
    socket.on("pets_updated", refreshOwnersPets);

    return () => {
      socket.off("connect", joinRoom);
      socket.off("owner_created", refreshOwnersPets);
      socket.off("pet_created", refreshOwnersPets);
      socket.off("pets_updated", refreshOwnersPets);
    };
  }, []);


  useEffect(() => {
    if (currentStep !== 2) return;

    const fetchServices = async () => {
      try{
        const res = await api.get("/appointment/services");
        const data = res.data;

        setServiceTypes(
          data.map(s => ({
            id: s.serviceID,
            label: s.service,
            note: s.shortDescription,
          }))
        )
      }catch(err){
        console.error(`Failed to fetch services: ${err.messages}`)
      }
    };

    fetchServices();
  }, [currentStep]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric"
    });
  };

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return owners;
    const query = searchQuery.toLowerCase();
    return owners.filter(user => 
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.phone.includes(query)
    );
  }, [searchQuery, owners]);

  const handleUserSelect = (user) => {
    setAppointmentData(prev => ({ ...prev, user, pet: null }));
    setSelectedClientId(user.id);
    setCurrentStep(1);
  };

  // Handle new client creation from AddOwnerModal
  const handleNewClientSave = async (ownerData) => {
    try {
      const payload = {
        firstName: ownerData.firstName,
        lastName: ownerData.lastName,
        email: ownerData.email,
        phone: ownerData.phone,
        address: ownerData.address || null,
        sex: ownerData.sex || null,
        dob: ownerData.dob || null,
        pets: (ownerData.pets || []).map((pet) => ({
          name: pet.name,
          type: pet.type,
          breed: pet.breed,
          sex: pet.sex || null,
          weight: pet.weight || null,
          color: pet.color || null,
          dob: pet.dob || null,
          notes: pet.notes || null,
        })),
      };

      const res = await api.post("/admin/add-owner", payload);
      const createdAccId = res.data?.accId;

      const createdUser = {
        id: createdAccId,
        firstName: ownerData.firstName,
        lastName: ownerData.lastName,
        email: ownerData.email,
        phone: ownerData.phone,
      };

      setAppointmentData((prev) => ({
        ...prev,
        user: createdUser,
        pet: null,
      }));
      setSelectedClientId(createdAccId || null);
      setShowNewClientForm(false);
      setCurrentStep(1);

      setToast({
        type: "success",
        message: `Account created and credentials were sent to ${ownerData.email}.`,
      });

      return res.data;
    } catch (error) {
      throw error;
    }
  };

  // Helper function to calculate age from birth date
  const calculateAge = (birthDate) => {
    if (!birthDate) return "Unknown";
    const today = new Date();
    const birth = new Date(birthDate);
    if (Number.isNaN(birth.getTime()) || birth > today) return "Unknown";

    const diffMs = today.getTime() - birth.getTime();
    const daysOld = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (daysOld < 7) {
      return `${daysOld} day${daysOld === 1 ? '' : 's'} old`;
    }

    if (daysOld < 28) {
      const weeksOld = Math.floor(daysOld / 7);
      return `${weeksOld} week${weeksOld === 1 ? '' : 's'} old`;
    }

    if (daysOld < 365) {
      const monthsOld = Math.floor(daysOld / 30);
      return `${monthsOld} month${monthsOld === 1 ? '' : 's'} old`;
    }

    let yearsOld = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      yearsOld--;
    }

    return `${yearsOld} yr${yearsOld === 1 ? '' : 's'} old`;
  };

  const handlePetSelect = (pet) => {
    setAppointmentData(prev => ({ ...prev, pet }));
    setCurrentStep(2); // Go to step 2 (Service Type)
  };

  const handleNewPetSubmit = () => {
    const validationErrors = {};

    if (!appointmentData.user?.id) {
      validationErrors.owner = "Please select an owner first before adding a pet.";
    }

    if (!String(newPet.name || "").trim()) {
      validationErrors.name = "Pet name is required.";
    }
    if (!newPet.type) {
      validationErrors.type = "Pet type is required.";
    }
    if (!newPet.breed) {
      validationErrors.breed = "Breed is required.";
    }
    if (!newPet.sex) {
      validationErrors.sex = "Gender is required.";
    }
    if (!newPet.birthDate) {
      validationErrors.birthDate = "Birth date is required.";
    } else {
      const selectedBirthDate = new Date(newPet.birthDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedBirthDate > today) {
        validationErrors.birthDate = "Birth date cannot be in the future.";
      }
    }

    setNewPetErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const newPetData = {
      id: samplePets.length + 1,
      userId: appointmentData.user.id,
      ...newPet
    };

    // In real app, you would send this to backend

    setAppointmentData(prev => ({ ...prev, pet: newPetData }));
    setShowNewPetForm(false);
    setNewPetErrors({});
    setNewPet({ name: "", type: "", breed: "", sex: "", weight: "", color: "", birthDate: "", notes: "" });
    setCurrentStep(2);
    
    setToast({ type: "success", message: "New pet added successfully!" });
  };

  const handlePetCreatedFromModal = async (savedPet) => {
    await fetchOwnersAndPets();

    const createdPet = {
      id: Number(savedPet.id),
      userId: Number(savedPet.ownerId),
      name: savedPet.name,
      type: savedPet.type,
      breed: savedPet.breed,
      sex: savedPet.sex,
      age: savedPet.dob ? calculateAge(savedPet.dob) : "Unknown",
      weight: savedPet.weight ? `${savedPet.weight} kg` : "",
      color: savedPet.color || "",
      notes: savedPet.notes || "",
      birthDate: savedPet.dob || "",
    };

    setAppointmentData((prev) => ({ ...prev, pet: createdPet }));
    setShowNewPetForm(false);
    setCurrentStep(2);
    setToast({ type: "success", message: "Pet added successfully." });
  };

  const handleServiceSelect = (serviceType) => {
    setAppointmentData(prev => ({ ...prev, serviceType }));
    setCurrentStep(3); // Go to step 3 (Date & Time)
  };

  const handleFinalSubmit = async () => {
    if (!appointmentData.user?.id || !appointmentData.pet?.id || !appointmentData.serviceType || !appointmentData.date || !appointmentData.time) {
      setToast({
        type: "error",
        message: "Please complete all required fields and select a time slot before confirming.",
      });
      return;
    }

    try{
      
      const serviceSelected = serviceTypes.find(
        s => s.label === appointmentData.serviceType
      );


      const payload = {
        userID: appointmentData.user.id,
        petID: appointmentData.pet.id,
        serviceID: serviceSelected.id,
        date: appointmentData.date,
        time: appointmentData.time,
      }

      await api.post("/admin/appointments/assign", payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        }
      });
    }catch(err){
      console.error("Booking error: ", err.message);
    }
    // In real app, you would send this to backend
    
    // Show success page instead of toast
    setCurrentStep(5); // Go to success page
  };

  const userPets = pets.filter(
    (pet) => Number(pet.userId) === Number(appointmentData.user?.id)
  );
  const ownerOptionsForModal = appointmentData.user
    ? [{
        id: appointmentData.user.id,
        name: `${appointmentData.user.firstName} ${appointmentData.user.lastName}`,
        email: appointmentData.user.email,
      }]
    : owners.map((owner) => ({
        id: owner.id,
        name: `${owner.firstName} ${owner.lastName}`,
        email: owner.email,
      }));

  const steps = [
    { title: "Select Client", number: 0, icon: User },
    { title: "Select Pet", number: 1, icon: PawPrint },
    { title: "Service Type", number: 2, icon: Layers },
    { title: "Date & Time", number: 3, icon: Calendar },
    { title: "Confirmation", number: 4, icon: CheckCircle }
  ];

  return (
    <div className="flex flex-col h-full bg-[#FBFBFB] p-6 gap-2 font-sans">
      {/* Back Button - Hide on success page */}
      {/* Progress Steps - Hide on success page */}
      {currentStep !== 5 && (
        <div className="flex justify-center mb-4">
          <div className="flex items-center">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div key={step.number} className="flex items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm border-2 ${
                      currentStep >= step.number
                        ? "bg-[#5EE6FE] border-[#5EE6FE] text-white"
                        : "bg-white border-gray-300 text-gray-400"
                    }`}
                  >
                    <IconComponent size={18} />
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-16 h-1 ${
                        currentStep > step.number ? "bg-[#5EE6FE]" : "bg-gray-300"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-[#E8F7FA] p-6  overflow-y-auto">
        {/* Step 0: Select Client - Professional Table View */}
        {currentStep === 0 && (
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Select Client</h2>
                <p className="text-gray-600">Choose an existing client or add a new one</p>
              </div>
              <button
                onClick={() => setShowNewClientForm(true)}
                className="flex items-center gap-2 px-6 py-3 bg-[#5EE6FE] text-white rounded-xl hover:bg-[#4AD4EC] transition font-semibold"
              >
                <Plus size={20} />
                Add New Client
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search clients by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5EE6FE] focus:border-transparent"
              />
            </div>

            {/* Clients Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Client</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Pets</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUsers.map(user => {
                      const userPetCount = pets.filter(
                        (pet) => Number(pet.userId) === Number(user.id)
                      ).length;
                      return (
                        <tr 
                          key={user.id}
                          className={`hover:bg-gray-50 transition ${
                            selectedClientId === user.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-semibold text-gray-900">{user.firstName} {user.lastName}</div>
                              <div className="text-sm text-gray-500">ID: {user.id.toString().padStart(4, '0')}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{user.email}</div>
                            <div className="text-sm text-gray-500">{user.phone}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {userPetCount} {userPetCount === 1 ? 'pet' : 'pets'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleUserSelect(user)}
                              className="px-4 py-2 bg-[#5EE6FE] text-white rounded-lg hover:bg-[#4AD4EC] transition text-sm font-medium"
                            >
                              Select
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <User className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No clients found</h3>
                  <p className="mt-2 text-gray-500">
                    {searchQuery ? "No clients match your search criteria." : "Get started by adding a new client."}
                  </p>
                </div>
              )}
            </div>

            {/* Reuse AddOwnerModal Component */}
            <AddOwnerModal
              isOpen={showNewClientForm}
              onClose={() => setShowNewClientForm(false)}
              onSave={handleNewClientSave}
              initialData={null} // No initial data for new client
            />
          </div>
        )}

        {/* Step 1: Select Pet */}
        {currentStep === 1 && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Select Pet</h2>
            <p className="text-gray-600 mb-6">Choose an existing pet for {appointmentData.user?.firstName} {appointmentData.user?.lastName} or add a new one</p>

            {/* Existing Pets */}
            {userPets.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Existing Pets</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userPets.map(pet => (
                    <div
                      key={pet.id}
                      onClick={() => handlePetSelect(pet)}
                      className="p-4 border border-gray-200 rounded-xl hover:border-[#5EE6FE] hover:shadow-md transition cursor-pointer bg-white"
                    >
                      <h4 className="font-semibold text-gray-800">{pet.name}</h4>
                      <p className="text-sm text-gray-600">{pet.breed} • {pet.age} • {pet.sex}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Pet Button */}
            <button
              onClick={() => setShowNewPetForm(true)}
              className="flex items-center gap-2 px-6 py-3 bg-[#5EE6FE] text-white rounded-xl hover:bg-[#4AD4EC] transition font-semibold"
            >
              <Plus size={20} />
              Add New Pet
            </button>

            {/* New Pet Form Modal - Keeping this separate since it's for adding pets to existing clients */}
            {false && showNewPetForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                <div className="w-full max-w-md bg-white rounded-xl shadow-2xl">
                  {/* Header */}
                  <div className="px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Add New Pet</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          For {appointmentData.user?.firstName} {appointmentData.user?.lastName}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowNewPetForm(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Form Content */}
                  <div className="p-5">
                    {newPetErrors.owner && (
                      <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        {newPetErrors.owner}
                      </div>
                    )}
                    <div className="space-y-4">
                      {/* Pet Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Pet Name *</label>
                        <input
                          type="text"
                          value={newPet.name}
                          onChange={(e) => {
                            setNewPet(prev => ({ ...prev, name: e.target.value }));
                            setNewPetErrors(prev => ({ ...prev, name: "" }));
                          }}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5EE6FE]"
                          placeholder="Enter pet name"
                        />
                        {newPetErrors.name && <p className="mt-1 text-xs text-red-600">{newPetErrors.name}</p>}
                      </div>

                      {/* Type & Breed */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                          <select
                            value={newPet.type}
                            onChange={(e) => {
                              setNewPet(prev => ({ ...prev, type: e.target.value }));
                              setNewPetErrors(prev => ({ ...prev, type: "" }));
                            }}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5EE6FE]"
                          >
                            <option value="">Select Type</option>
                            <option value="Dog">Dog</option>
                            <option value="Cat">Cat</option>
                          </select>
                          {newPetErrors.type && <p className="mt-1 text-xs text-red-600">{newPetErrors.type}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Breed *</label>
                          <select
                            value={newPet.breed}
                            onChange={(e) => {
                              setNewPet(prev => ({ ...prev, breed: e.target.value }));
                              setNewPetErrors(prev => ({ ...prev, breed: "" }));
                            }}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5EE6FE]"
                          >
                            <option value="">Select Breed</option>
                            {newPet.type === "Dog" && (
                              <>
                                <option value="Chihuahua">Chihuahua</option>
                                <option value="Shih Tzu">Shih Tzu</option>
                                <option value="Labrador">Labrador</option>
                                <option value="Mixed Breed">Mixed Breed</option>
                              </>
                            )}
                            {newPet.type === "Cat" && (
                              <>
                                <option value="Domestic Shorthair">Domestic</option>
                                <option value="Siamese">Siamese</option>
                                <option value="Persian">Persian</option>
                                <option value="Mixed Breed">Mixed Breed</option>
                              </>
                            )}
                          </select>
                          {newPetErrors.breed && <p className="mt-1 text-xs text-red-600">{newPetErrors.breed}</p>}
                        </div>
                      </div>

                      {/* Gender & Birth Date */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="sex"
                                value="Male"
                                checked={newPet.sex === "Male"}
                                onChange={(e) => {
                                  setNewPet(prev => ({ ...prev, sex: e.target.value }));
                                  setNewPetErrors(prev => ({ ...prev, sex: "" }));
                                }}
                                className="w-4 h-4 text-[#5EE6FE] focus:ring-[#5EE6FE]"
                              />
                              <span className="text-sm text-gray-700">Male</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="sex"
                                value="Female"
                                checked={newPet.sex === "Female"}
                                onChange={(e) => {
                                  setNewPet(prev => ({ ...prev, sex: e.target.value }));
                                  setNewPetErrors(prev => ({ ...prev, sex: "" }));
                                }}
                                className="w-4 h-4 text-[#5EE6FE] focus:ring-[#5EE6FE]"
                              />
                              <span className="text-sm text-gray-700">Female</span>
                            </label>
                          </div>
                          {newPetErrors.sex && <p className="mt-1 text-xs text-red-600">{newPetErrors.sex}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Birth Date *</label>
                          <input
                            type="date"
                            value={newPet.birthDate}
                            max={format(new Date(), 'yyyy-MM-dd')}
                            onChange={(e) => {
                              setNewPet(prev => ({ ...prev, birthDate: e.target.value }));
                              setNewPetErrors(prev => ({ ...prev, birthDate: "" }));
                            }}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5EE6FE]"
                          />
                          {newPetErrors.birthDate && <p className="mt-1 text-xs text-red-600">{newPetErrors.birthDate}</p>}
                        </div>
                      </div>

                      {/* Weight & Color */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                          <input
                            type="number"
                            value={newPet.weight}
                            onChange={(e) => setNewPet(prev => ({ ...prev, weight: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5EE6FE]"
                            placeholder="0.0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                          <input
                            type="text"
                            value={newPet.color}
                            onChange={(e) => setNewPet(prev => ({ ...prev, color: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5EE6FE]"
                            placeholder="Color"
                          />
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                        <textarea
                          value={newPet.notes}
                          onChange={(e) => setNewPet(prev => ({ ...prev, notes: e.target.value }))}
                          rows="2"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5EE6FE] resize-none"
                          placeholder="Any additional notes..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setShowNewPetForm(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleNewPetSubmit}
                        className="px-4 py-2 bg-[#5EE6FE] text-white text-sm font-medium rounded-lg hover:bg-[#4AD4EC] transition-colors"
                      >
                        Add Pet
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Service Type */}
        {currentStep === 2 && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Select Service Type</h2>
            <p className="text-gray-600 mb-6">Choose the type of service needed</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {serviceTypes.map(service => (
                <div
                  key={service.id}
                  onClick={() => handleServiceSelect(service.label)}
                  className={`p-4 border-2 rounded-xl transition cursor-pointer text-left ${
                    appointmentData.serviceType === service.label
                      ? "border-[#5EE6FE] bg-[#F0FDFF] shadow-md"
                      : "border-gray-200 bg-white hover:border-[#5EE6FE] hover:shadow-md"
                  }`}
                >
                  <h4 className="font-semibold text-gray-800 mb-1">{service.label}</h4>
                  <p className="text-sm text-gray-600">{service.note}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setCurrentStep(3)}
                disabled={!appointmentData.serviceType}
                className="px-6 py-3 bg-[#5EE6FE] text-white rounded-xl hover:bg-[#4AD4EC] transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                Next: Date & Time
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Date & Time - Using date-fns like Step2DateTime.js */}
        {currentStep === 3 && (
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Select Date & Time</h2>
            <p className="text-gray-600 mb-6">Choose appointment schedule</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar Section */}
              <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-sm text-gray-500">Selected service</div>
                    <div className="text-lg font-semibold text-gray-800">{appointmentData.serviceType}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={prevMonth}
                      className="p-2 rounded-lg hover:bg-gray-100 transition"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <div className="text-lg font-semibold text-gray-800">
                      {format(currentMonth, "MMMM yyyy")}
                    </div>
                    <button 
                      onClick={nextMonth}
                      className="p-2 rounded-lg hover:bg-gray-100 transition"
                    >
                      <ArrowLeft size={16} className="rotate-180" />
                    </button>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                  
                  {calendar.map((week, weekIndex) =>
                    week.map((day, dayIndex) => {
                      const isDisabled = isPast(day) || !isSameMonth(day, currentMonth);
                      const isSelected = appointmentData.date && isSameDay(day, new Date(appointmentData.date));
                      
                      return (
                        <button
                          key={`${weekIndex}-${dayIndex}`}
                          onClick={() => {
                            if (!isDisabled) {
                              setAppointmentData(prev => ({ 
                                ...prev, 
                                date: format(day, 'yyyy-MM-dd'),
                                time: "" 
                              }));
                            }
                          }}
                          className={`h-12 flex items-center justify-center rounded-lg transition ${
                            !isSameMonth(day, currentMonth) ? "text-gray-300" : ""
                          } ${
                            isDisabled 
                              ? "opacity-40 cursor-not-allowed" 
                              : "cursor-pointer hover:bg-[#EEF8FA]"
                          } ${
                            isSelected 
                              ? "bg-[#5EE6FE] text-white" 
                              : "bg-white"
                          }`}
                        >
                          <div className="text-sm font-medium">{format(day, "d")}</div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Time Slots Section */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="text-sm text-gray-500 mb-4">Available time slots</div>
                
                {appointmentData.date ? (
                  <>
                    <div className="text-sm font-medium text-gray-800 mb-4">
                      {format(new Date(appointmentData.date), "EEEE, MMM d")}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {timeSlots.map((slot) => {
                        const isBooked = bookedSlots.includes(slot);
                        const selectedDate = appointmentData.date ? new Date(appointmentData.date) : null;
                        const isToday = selectedDate && isSameDay(selectedDate, new Date());
                        const slotMinutes = parseDisplayTimeToMinutes(slot);
                        const now = new Date();
                        const nowMinutes = now.getHours() * 60 + now.getMinutes();
                        const isPastSlot = Boolean(isToday && slotMinutes !== null && slotMinutes <= nowMinutes);
                        const isDisabled = isBooked || isPastSlot;
                        const isSelected = appointmentData.time === slot;
                        
                        return (
                          <button
                            key={slot}
                            onClick={() => !isDisabled && setAppointmentData(prev => ({ ...prev, time: slot }))}
                            disabled={isDisabled}
                            className={`p-3 rounded-lg text-sm font-medium transition ${
                              isSelected
                                ? "bg-[#5EE6FE] text-white shadow-md"
                                : isDisabled
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {slot}
                            {isBooked && <span className="ml-1 text-xs">(Booked)</span>}
                            {!isBooked && isPastSlot && <span className="ml-1 text-xs">(Past)</span>}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentStep(4)}
                      disabled={!appointmentData.time}
                      className="w-full mt-6 py-3 bg-[#5EE6FE] text-white rounded-lg hover:bg-[#4AD4EC] transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                      Next: Confirmation
                    </button>
                  </>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    Select a date to see available time slots
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {currentStep === 4 && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-1">Confirm Appointment</h2>
            <p className="text-gray-600 mb-4 text-sm">Review details before submitting</p>

            <div className="bg-gray-50 rounded-lg p-4 space-y-4 mb-6">
              {/* Client & Pet Info - Side by side */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <h4 className="font-semibold text-gray-700 mb-2 text-sm">Client Info</h4>
                  <div className="space-y-1 text-xs">
                    <p><span className="font-medium">Name:</span> {appointmentData.user?.firstName} {appointmentData.user?.lastName}</p>
                    <p><span className="font-medium">Email:</span> {appointmentData.user?.email}</p>
                    <p><span className="font-medium">Phone:</span> {appointmentData.user?.phone}</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <h4 className="font-semibold text-gray-700 mb-2 text-sm">Pet Info</h4>
                  <div className="space-y-1 text-xs">
                    <p><span className="font-medium">Name:</span> {appointmentData.pet?.name}</p>
                    <p><span className="font-medium">Breed:</span> {appointmentData.pet?.breed}</p>
                    <p><span className="font-medium">Age:</span> {appointmentData.pet?.age} • {appointmentData.pet?.sex}</p>
                  </div>
                </div>
              </div>

              {/* Appointment Details */}
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-2 text-sm">Appointment Details</h4>
                <div className="space-y-1 text-xs">
                  <p><span className="font-medium">Service:</span> {appointmentData.serviceType}</p>
                  <p><span className="font-medium">When:</span> {appointmentData.date} at {appointmentData.time}</p>
                  {appointmentData.reason && (
                    <p><span className="font-medium">Reason:</span> {appointmentData.reason}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setCurrentStep(3)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
              >
                Back
              </button>
              <button
                onClick={handleFinalSubmit}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold text-sm"
              >
                Confirm
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Success Page */}
        {currentStep === 5 && (
          <div className="max-w-md mx-auto text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Appointment Scheduled!</h2>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-sm">
              <div className="space-y-2 text-green-800 text-left">
                <p><strong>Client:</strong> {appointmentData.user?.firstName} {appointmentData.user?.lastName}</p>
                <p><strong>Pet:</strong> {appointmentData.pet?.name}</p>
                <p><strong>Service:</strong> {appointmentData.serviceType}</p>
                <p><strong>When:</strong> {appointmentData.date} at {appointmentData.time}</p>
                <p><strong>ID:</strong> APT-{Date.now().toString().slice(-6)}</p>
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-6">
              Confirmation sent to {appointmentData.user?.email}
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate(appointmentsHomePath)}
                className="px-6 py-2.5 bg-[#5EE6FE] text-white rounded-lg hover:bg-[#4AD4EC] transition font-semibold text-sm"
              >
                View Appointments
              </button>
              <button
                onClick={() => {
                  setAppointmentData({
                    user: null,
                    pet: null,
                    serviceType: "",
                    date: "",
                    time: "",
                    reason: "",
                    notes: ""
                  });
                  setCurrentStep(0);
                }}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold text-sm"
              >
                Book Another
              </button>
            </div>
          </div>
        )}
      </div>

      <AddPetModal
        isOpen={showNewPetForm}
        onClose={() => setShowNewPetForm(false)}
        onSave={handlePetCreatedFromModal}
        owners={ownerOptionsForModal}
        initialData={null}
        refreshPets={fetchOwnersAndPets}
        defaultOwnerId={appointmentData.user?.id || ""}
        lockOwnerSelection={Boolean(appointmentData.user?.id)}
      />

      {/* Success Toast */}
      {toast?.type === "success" && currentStep !== 5 && (
        <SuccessToast 
          message={toast.message} 
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default AddAppointment;

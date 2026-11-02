import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Calendar, Layers, User, PawPrint, CheckCircle, Clock } from "lucide-react";
import { format } from 'date-fns';
import SuccessToast from "../components/template/SuccessToast.jsx";
import AddOwnerModal from "../components/petpatient-management/AddOwnerModal";
import AddPetModal from "../components/petpatient-management/AddPetModal";
import api from "../api/axios";
import socket from "../socket";

// Sample existing users data
const sampleUsers = [
  { id: 1, firstName: "Mark", lastName: "Mapili", email: "mark@gmail.com", phone: "09123456789"},
  { id: 2, firstName: "Miguel", lastName: "Rojero", email: "miguel@gmail.com", phone: "09123456788"},
  { id: 3, firstName: "Jordan", lastName: "Frando", email: "jordan@gmail.com", phone: "09123456787"},
  { id: 4, firstName: "Anna", lastName: "Cruz", email: "anna@gmail.com", phone: "09123456786"},
  { id: 5, firstName: "Ella", lastName: "Santos", email: "ella@gmail.com", phone: "09123456785"},
];

// Sample existing pets data
const samplePets = [
  { id: 1, userId: 1, name: "Bogart", type: "Dog", breed: "Chihuahua", age: "3", sex: "Male", weight: "8", color: "Brown", birthDate: "2020-05", notes: "" },
  { id: 2, userId: 2, name: "Tan tan", type: "Dog", breed: "Shih Tzu", age: "2", sex: "Female", weight: "6", color: "White", birthDate: "2021-08", notes: "" },
  { id: 3, userId: 1, name: "Max", type: "Dog", breed: "Golden Retriever", age: "4", sex: "Male", weight: "25", color: "Golden", birthDate: "2019-03", notes: "" },
];

// Sample appointments data
const sampleAppointments = [
  { id: 1, userId: 1, petId: 1, petName: "Bogart", serviceType: "Consultation", date: new Date().toISOString().split('T')[0], time: "10:00 AM", status: "Upcoming" },
  { id: 2, userId: 2, petId: 2, petName: "Tan tan", serviceType: "Vaccination", date: new Date().toISOString().split('T')[0], time: "2:00 PM", status: "Upcoming" },
  { id: 3, userId: 1, petId: 3, petName: "Max", serviceType: "Dental Prophylaxis", date: new Date(Date.now() + 86400000).toISOString().split('T')[0], time: "11:00 AM", status: "Upcoming" },
];

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

const AddVisit = () => {
  const navigate = useNavigate();
  const isVet = localStorage.getItem("userRole") === "3";
  const visitsHomePath = isVet ? "/vet?tab=appointments" : "/admin/appointments";
  const [currentStep, setCurrentStep] = useState(0);
  const [visitData, setVisitData] = useState({
    user: null,
    appointment: null,
    pet: null,
    serviceType: "",
    date: format(new Date(), 'yyyy-MM-dd'),
    time: format(new Date(), 'HH:mm'),
    reason: "",
    notes: "",
    isWalkIn: true
  });
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [showNewPetForm, setShowNewPetForm] = useState(false);
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [owners, setOwners] = useState([]);
  const [pets, setPets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);

  const isWithinClinicHours = (dateValue, timeValue) => {
    if (!dateValue || !timeValue) return false;

    const selectedDateTime = new Date(`${dateValue}T${timeValue}`);
    if (Number.isNaN(selectedDateTime.getTime())) return false;

    const day = selectedDateTime.getDay();
    const hour = selectedDateTime.getHours();
    const minute = selectedDateTime.getMinutes();
    const totalMinutes = hour * 60 + minute;

    const weekdayOpen = 9 * 60;
    const sundayOpen = 13 * 60;
    const close = 21 * 60;
    const open = day === 0 ? sundayOpen : weekdayOpen;

    return totalMinutes >= open && totalMinutes <= close;
  };

  const canSubmitVisit = isWithinClinicHours(visitData.date, visitData.time);


  const fetchOwnerDetails = async () => {
    try {
      const res = await api.get("/admin/appointments/owners");

      setOwners(res.data.owners || []);
      setPets((res.data.pets || []).map((pet) => ({
        ...pet,
        id: pet.id ?? pet.petID,
        userId: pet.userId ?? pet.accID,
      })));
      setAppointments(res.data.appointments || []);
    } catch (err) {
      console.error("Error fetching owner details: ", err.message);
    }
  };

  useEffect(() => {
    fetchOwnerDetails();
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
      fetchOwnerDetails();
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

  const handleUserSelect = (user) => {
    setVisitData(prev => ({ ...prev, user, appointment: null, pet: null }));
    setSelectedClientId(user.id);

    // Always show pet selection even when the client has only one pet.
    // This prevents accidental auto-skip and keeps flow consistent.
    setCurrentStep(1);
  };
  const handleNewClientSave = async (ownerData) => {
    const formData = {
      firstName: ownerData.firstName,
      lastName: ownerData.lastName,
      email: ownerData.email,
      phone: ownerData.phone,
      address: ownerData.address || null,
      sex: ownerData.sex || null,
      dob: ownerData.dob || null,

      pets: ownerData.pets?.map(pet => ({
        name: pet.name,
        type: pet.type,
        breed: pet.breed,
        sex: pet.sex || null,
        weight: pet.weight || null,
        color: pet.color || null,
        dob: pet.dob || null,
        notes: pet.notes || null
      })) || []
    };


    const res = await api.post("/admin/add-owner", formData);

    const createdOwner = {
      id: res.data?.accId,
      firstName: ownerData.firstName,
      lastName: ownerData.lastName,
      email: ownerData.email,
      phone: ownerData.phone,
    };

    setVisitData(prev => ({ 
      ...prev, 
      user: createdOwner,
      pet: null,
    }));
    setSelectedClientId(createdOwner.id || null);
    setShowNewClientForm(false);
    
    setCurrentStep(1);
    
    setToast({ 
      type: "success", 
      message: `Account created and credentials were sent to ${createdOwner.email}.`
    });

    return res.data;
  };

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age.toString();
  };

  const handleAppointmentSelect = (appointment) => {
    const selectedPet = pets.find(pet => pet.id === appointment.petId);
    setVisitData(prev => ({ 
      ...prev, 
      appointment,
      pet: selectedPet,
      serviceType: appointment.serviceType
    }));
    setCurrentStep(4); // Go to mark as complete step
  };

  const handleServiceSelect = (serviceType) => {
    setVisitData(prev => ({ ...prev, serviceType }));
    setCurrentStep(3); // Go to confirmation
  };

  const handlePetCreatedFromModal = async (savedPet) => {
    await fetchOwnerDetails();

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

    setVisitData((prev) => ({ ...prev, pet: createdPet }));
    setShowNewPetForm(false);
    setCurrentStep(2);
    setToast({ type: "success", message: "Pet added successfully." });
  };

  const handleFinalSubmit = async () => {

    if (!visitData.user?.id || !visitData.pet?.id || !visitData.serviceType) {
      console.error("Missing required fields:", visitData);
      setToast({ type: "error", message: "Please select a client, pet, and service before submitting." });
      return;
    }

    const payload = {
      userID: visitData.user.id,
      petID: visitData.pet.id,
      serviceType: visitData.serviceType, // string, e.g., "Consultation"
    };

    const res = await api.post("/admin/appointments/make-visit", payload);
    
    setCurrentStep(4); // Go to success page
  };

  const userPets = pets.filter(pet => pet.userId === visitData.user?.id);
  const ownerOptionsForModal = visitData.user
    ? [{
        id: visitData.user.id,
        name: `${visitData.user.firstName} ${visitData.user.lastName}`,
        email: visitData.user.email,
      }]
    : owners.map((owner) => ({
        id: owner.id,
        name: `${owner.firstName} ${owner.lastName}`,
        email: owner.email,
      }));

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return owners;
    const query = searchQuery.toLowerCase();
    return owners.filter(user => 
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.phone.includes(query)
    );
  }, [searchQuery, owners]);

  const steps = [
    { title: "Select Client", number: 0, icon: User },
    { title: "Select Pet", number: 1, icon: PawPrint },
    { title: "Service Type", number: 2, icon: Layers },
    { title: "Confirmation", number: 3, icon: CheckCircle },
    { title: "Completed", number: 4, icon: CheckCircle },
  ];

  return (
    <div className="flex flex-col h-full bg-[#FBFBFB] p-6 gap-2 font-sans">
      {currentStep !== 4 && (
        <div className="flex justify-center mb-4">
          <div className="flex items-center">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              const isActive = currentStep >= step.number;
              const isCurrent = currentStep === step.number;
              
              return (
                <div key={step.number} className="flex items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm border-2 ${
                      isActive
                        ? "bg-[#5EE6FE] border-[#5EE6FE] text-white"
                        : "bg-white border-gray-300 text-gray-400"
                    } ${isCurrent ? "ring-2 ring-[#5EE6FE] ring-offset-2" : ""}`}
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

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-[#E8F7FA] p-6 overflow-y-auto">
        {/* Step 0: Select Client */}
        {currentStep === 0 && (
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Select Client</h2>
                <p className="text-gray-600">Choose an existing client or add a new one for walk-in visit</p>
              </div>
              <button
                onClick={() => setShowNewClientForm(true)}
                className="flex items-center gap-2 px-6 py-3 bg-[#5EE6FE] text-white rounded-xl hover:bg-[#4AD4EC] transition font-semibold"
              >
                <Plus size={20} />
                Add New Client
              </button>
            </div>

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

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Client</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Pets</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Today's Appointments</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUsers.map(user => {
                      const todayStr = new Date().toLocaleDateString('en-CA');                 
                      const userPetCount = pets.filter(pet => pet.userId === user.id).length;
                      const todayAppointments = appointments.filter(
                        app => app.userId === user.id && 
                        app.date === todayStr &&
                        app.status === "Upcoming"
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
                              <div className="text-sm text-gray-500">ID: {user.id?.toString().padStart(4, '0')}</div>
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
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              todayAppointments > 0 ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {todayAppointments} today
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

            <AddOwnerModal
              isOpen={showNewClientForm}
              onClose={() => setShowNewClientForm(false)}
              onSave={handleNewClientSave}
              initialData={null} 
            />
          </div>
        )}

        {currentStep === 1 && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-2">Select Pet</h2>
            <p className="text-gray-600 mb-6">
              Choose a pet for {visitData.user?.firstName}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userPets.map(pet => (
                <div
                  key={pet.id}
                  onClick={() => {
                    setVisitData(prev => ({ ...prev, pet }));
                    setCurrentStep(2);
                  }}
                  className="p-4 border-2 rounded-xl cursor-pointer hover:border-[#5EE6FE]"
                >
                  <h4 className="font-semibold">{pet.name}</h4>
                  <p className="text-sm text-gray-500">{pet.breed}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowNewPetForm(true)}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-[#5EE6FE] text-white rounded-xl hover:bg-[#4AD4EC] transition font-semibold"
            >
              <Plus size={18} />
              Add New Pet
            </button>

            {userPets.length === 0 && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                No pet is linked to this client yet. Please select a client with a registered pet or add a pet first in Customer and Pet Management.
              </div>
            )}
          </div>
        )}

        {/* Step 2: Service Type */}
        {currentStep === 2 && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Select Service Type</h2>
            <p className="text-gray-600 mb-6">Choose the type of service needed for this walk-in visit</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {serviceTypes.map(service => (
                <div
                  key={service.id}
                  onClick={() => handleServiceSelect(service.label)}
                  className={`p-4 border-2 rounded-xl transition cursor-pointer text-left ${
                    visitData.serviceType === service.label
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
                disabled={!visitData.serviceType}
                className="px-6 py-3 bg-[#5EE6FE] text-white rounded-xl hover:bg-[#4AD4EC] transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                Next: Confirmation
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {currentStep === 3 && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Confirm Walk-in Visit</h2>
            <p className="text-gray-600 mb-4 text-sm">Review details before submitting</p>

            <div className="bg-gray-50 rounded-lg p-6 space-y-4 mb-6">
              {/* Client & Pet Info - Side by side */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-700 mb-3 text-sm">Client Info</h4>
                  <div className="space-y-2 text-xs">
                    <p><span className="font-medium">Name:</span> {visitData.user?.firstName} {visitData.user?.lastName}</p>
                    <p><span className="font-medium">Email:</span> {visitData.user?.email}</p>
                    <p><span className="font-medium">Phone:</span> {visitData.user?.phone}</p>
                  </div>
                </div>
                
                {visitData.pet && (
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-700 mb-3 text-sm">Pet Info</h4>
                    <div className="space-y-2 text-xs">
                      <p><span className="font-medium">Name:</span> {visitData.pet?.name}</p>
                      <p><span className="font-medium">Breed:</span> {visitData.pet?.breed}</p>
                      <p><span className="font-medium">Age:</span> {visitData.pet?.age} • {visitData.pet?.sex}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Visit Details */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-3 text-sm">Visit Details</h4>
                <div className="space-y-2 text-xs">
                  <p><span className="font-medium">Service:</span> {visitData.serviceType}</p>
                  <p><span className="font-medium">Visit Type:</span> 
                    <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                      Walk-in
                    </span>
                  </p>
                  <p><span className="font-medium">Date & Time:</span> {visitData.date} at {format(new Date(`2000-01-01T${visitData.time}`), 'h:mm a')}</p>
                  {visitData.appointment && (
                    <p><span className="font-medium">Original Appointment:</span> Completed</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
              >
                Back
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={!canSubmitVisit}
                className={`px-6 py-2 rounded-lg transition font-semibold text-sm ${
                  canSubmitVisit
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-gray-300 text-gray-600 cursor-not-allowed"
                }`}
              >
                Confirm Visit
              </button>
            </div>
            {!canSubmitVisit && (
              <p className="mt-3 text-xs text-red-600">
                Selected visit time is outside clinic hours. Visits are allowed Mon-Sat 9:00 AM-9:00 PM, Sun 1:00 PM-9:00 PM.
              </p>
            )}
          </div>
        )}

        {/* Step 5: Success Page */}
        {currentStep === 4 && (
          <div className="max-w-md mx-auto text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Visit Recorded!</h2>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-sm">
              <div className="space-y-2 text-green-800 text-left">
                <p><strong>Client:</strong> {visitData.user?.firstName} {visitData.user?.lastName}</p>
                {visitData.pet && <p><strong>Pet:</strong> {visitData.pet?.name}</p>}
                <p><strong>Service:</strong> {visitData.serviceType}</p>
                <p><strong>Visit Type:</strong> {visitData.visitType}</p>
                <p><strong>When:</strong> {visitData.date} at {visitData.time}</p>
                <p><strong>ID:</strong> {visitData.id}</p>
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-6">
              Visit has been recorded in the system
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate(visitsHomePath)}
                className="px-6 py-2.5 bg-[#5EE6FE] text-white rounded-lg hover:bg-[#4AD4EC] transition font-semibold text-sm"
              >
                View Visits
              </button>
              <button
                onClick={() => {
                  setVisitData({
                    user: null,
                    appointment: null,
                    pet: null,
                    serviceType: "",
                    date: format(new Date(), 'yyyy-MM-dd'),
                    time: format(new Date(), 'HH:mm'),
                    reason: "",
                    notes: "",
                    isWalkIn: true
                  });
                  setCurrentStep(0);
                }}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold text-sm"
              >
                Record Another Visit
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
        refreshPets={fetchOwnerDetails}
        defaultOwnerId={visitData.user?.id || ""}
        lockOwnerSelection={Boolean(visitData.user?.id)}
      />

      {/* Success Toast */}
      {toast?.type === "success" && currentStep !== 4 && (
        <SuccessToast 
          message={toast.message} 
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default AddVisit;

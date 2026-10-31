import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../data/appointment_service.dart';
import '../../../core/theme/app_theme.dart';
import 'appointment_availability_screen.dart';
import '../widgets/appointment_widgets.dart';

class AppointmentSelectionScreen extends StatefulWidget {
  const AppointmentSelectionScreen({super.key});

  @override
  State<AppointmentSelectionScreen> createState() =>
      _AppointmentSelectionScreenState();
}

class _AppointmentSelectionScreenState
    extends State<AppointmentSelectionScreen> {
  String _pet = '';
  String _procedure = 'Checkup';
  List<AppointmentPet> _pets = const [];
  List<AppointmentServiceOption> _services = const [];
  Object? _loadError;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSelectionData();
  }

  Future<void> _loadSelectionData() async {
    try {
      final service = context.read<AppointmentService>();
      final results = await Future.wait([
        service.fetchUserPets().then(
          (value) => value,
          onError: (_) => <AppointmentPet>[],
        ),
        service.fetchServices().then(
          (value) => value,
          onError: (_) => <AppointmentServiceOption>[],
        ),
      ]);
      if (!mounted) return;
      setState(() {
        _pets = results[0] as List<AppointmentPet>;
        _services = results[1] as List<AppointmentServiceOption>;
        _isLoading = false;
        if (_pets.isNotEmpty) _pet = _pets.first.name;
        if (_services.isNotEmpty) _procedure = _services.first.name;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _loadError = error;
        _isLoading = false;
      });
    }
  }

  Future<void> _selectPet() async {
    final selected = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: Colors.white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) {
        return SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 44,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppTheme.border,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                const Text(
                  'Select your pet',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.heading,
                  ),
                ),
                const SizedBox(height: 16),
                ..._pets.map((pet) {
                  final isSelected = _pet == pet.name;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: InkWell(
                      onTap: () => Navigator.pop(sheetContext, pet.name),
                      borderRadius: BorderRadius.circular(18),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 14,
                        ),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: isSelected
                                ? AppTheme.primaryDark
                                : AppTheme.border,
                            width: isSelected ? 2 : 1,
                          ),
                        ),
                        child: Row(
                          children: [
                            CircleAvatar(
                              radius: 25,
                              backgroundColor: const Color(0xFFF0F1F2),
                              child: Icon(
                                pet.name == 'Luna'
                                    ? Icons.pets
                                    : Icons.cruelty_free_outlined,
                                color: AppTheme.primaryDark,
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    pet.name,
                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w800,
                                      color: AppTheme.heading,
                                    ),
                                  ),
                                  const SizedBox(height: 3),
                                  Text(
                                    pet.breed,
                                    style: const TextStyle(
                                      fontSize: 13,
                                      color: AppTheme.muted,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            if (isSelected)
                              const Icon(
                                Icons.check_circle,
                                color: AppTheme.primaryDark,
                              )
                            else
                              const Icon(
                                Icons.circle_outlined,
                                color: Color(0xFF9CA9B5),
                              ),
                          ],
                        ),
                      ),
                    ),
                  );
                }),
              ],
            ),
          ),
        );
      },
    );

    if (selected != null) {
      setState(() => _pet = selected);
    }
  }

  IconData _serviceIcon(String name) {
    final normalized = name.toLowerCase();
    if (normalized.contains('vacc')) return Icons.shield_outlined;
    if (normalized.contains('surg')) return Icons.add_box_outlined;
    if (normalized.contains('groom')) return Icons.content_cut_outlined;
    return Icons.medical_services_outlined;
  }

  String _serviceDescription(String name) {
    final normalized = name.toLowerCase();
    if (normalized.contains('vacc')) return 'Scheduled immunizations';
    if (normalized.contains('surg')) return 'Specialist procedures';
    if (normalized.contains('groom')) return 'Nails, coat & bath style';
    return 'Routine health screening';
  }

  AppointmentPet? get _selectedPet {
    for (final pet in _pets) {
      if (pet.name == _pet) return pet;
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: appointmentAppBar(
        context,
        title: 'Book Appointment',
        showBack: true,
      ),
      body: SafeArea(
        top: false,
        child: Column(
          children: [
            const AppointmentProgress(step: 1, label: 'Step 1 of 2'),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 10),
                    const AppointmentSectionLabel('WHO IS THIS FOR?'),
                    const SizedBox(height: 14),
                    InkWell(
                      onTap: _selectPet,
                      borderRadius: BorderRadius.circular(18),
                      child: Container(
                        height: 72,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: AppTheme.border),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 44,
                              height: 44,
                              decoration: const BoxDecoration(
                                color: Color(0xFFF0F1F2),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.pets,
                                color: AppTheme.primary,
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    _pet,
                                    style: const TextStyle(
                                      fontSize: 17,
                                      fontWeight: FontWeight.w800,
                                      color: AppTheme.heading,
                                    ),
                                  ),
                                  Text(
                                    _selectedPet?.breed ?? '',
                                    style: const TextStyle(
                                      fontSize: 13,
                                      color: AppTheme.muted,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const Icon(
                              Icons.keyboard_arrow_down,
                              color: AppTheme.muted,
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 26),
                    const AppointmentSectionLabel('SELECT PROCEDURE TYPE'),
                    const SizedBox(height: 16),
                    if (_loadError != null)
                      const Text(
                        'Unable to load pets and services. Please try again.',
                        style: TextStyle(color: AppTheme.muted),
                      )
                    else
                      GridView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 2,
                              mainAxisSpacing: 14,
                              crossAxisSpacing: 14,
                              mainAxisExtent: 178,
                            ),
                        itemCount: _services.length,
                        itemBuilder: (_, index) {
                          final item = _services[index];
                          final selected = _procedure == item.name;
                          return InkWell(
                            onTap: () => setState(() => _procedure = item.name),
                            borderRadius: BorderRadius.circular(24),
                            child: Container(
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(24),
                                border: Border.all(
                                  color: selected
                                      ? const Color(0xFF55D6E5)
                                      : AppTheme.border,
                                  width: selected ? 3 : 1,
                                ),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    width: 50,
                                    height: 50,
                                    decoration: BoxDecoration(
                                      color: selected
                                          ? const Color(0xFF62D4EA)
                                          : const Color(0xFFF0F1F2),
                                      borderRadius: BorderRadius.circular(18),
                                    ),
                                    child: Icon(
                                      _serviceIcon(item.name),
                                      size: 24,
                                      color: AppTheme.heading,
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  Text(
                                    item.name,
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w800,
                                      color: AppTheme.heading,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    _serviceDescription(item.name),
                                    style: const TextStyle(
                                      fontSize: 13,
                                      height: 1.25,
                                      color: AppTheme.muted,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                  ],
                ),
              ),
            ),
            AppointmentBottomButton(
              label: 'Next',
              onTap: _isLoading || _loadError != null
                  ? null
                  : () => Navigator.push(
                      context,
                      MaterialPageRoute<void>(
                        builder: (_) => AppointmentAvailabilityScreen(
                          pet: _pet,
                          procedure: _procedure,
                          petId: _selectedPet!.petId,
                          serviceId: _services
                              .firstWhere(
                                (service) => service.name == _procedure,
                              )
                              .serviceId,
                        ),
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

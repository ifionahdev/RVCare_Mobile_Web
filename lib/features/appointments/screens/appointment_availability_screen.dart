import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_theme.dart';
import '../data/appointment_service.dart';
import '../widgets/appointment_widgets.dart';
import 'appointment_summary_screen.dart';

class AppointmentAvailabilityScreen extends StatefulWidget {
  const AppointmentAvailabilityScreen({
    super.key,
    required this.pet,
    required this.procedure,
    required this.petId,
    required this.serviceId,
  });

  final String pet;
  final String procedure;
  final int petId;
  final int serviceId;

  @override
  State<AppointmentAvailabilityScreen> createState() =>
      _AppointmentAvailabilityScreenState();
}

class _AppointmentAvailabilityScreenState
    extends State<AppointmentAvailabilityScreen> {
  String _vet = 'Any available vet';
  int? _vetId;
  String? _time;
  int _dateIndex = 2;
  List<AppointmentTimeslot> _slots = const [];
  Object? _availabilityError;
  bool _isLoadingAvailability = false;

  static const _dates = [
    ('Mon', '2'),
    ('Tue', '3'),
    ('Wed', '4'),
    ('Thu', '5'),
    ('Fri', '6'),
    ('Sat', '7'),
  ];
  List<AppointmentVeterinarian> _vets = const [];
  DateTime get _selectedDate => DateTime(2026, 11, _dateIndex + 2);
  AppointmentTimeslot? get _selectedTimeslot {
    for (final slot in _slots) {
      if (slot.display == _time) return slot;
    }
    return null;
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadVeterinarians();
    });
  }

  Future<void> _loadVeterinarians() async {
    try {
      final vets = await context
          .read<AppointmentService>()
          .fetchVeterinarians();
      if (!mounted) return;
      setState(() => _vets = vets);
    } catch (error) {
      if (!mounted) return;
      setState(() => _availabilityError = error);
    } finally {
      if (mounted) _loadAvailability();
    }
  }

  Future<void> _loadAvailability() async {
    setState(() {
      _isLoadingAvailability = true;
      _availabilityError = null;
      _time = null;
    });

    try {
      final slots = await context.read<AppointmentService>().fetchAvailability(
        date: _selectedDate,
        vetId: _vetId,
      );
      if (!mounted) return;
      setState(() {
        _slots = slots;
        _isLoadingAvailability = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _availabilityError = error;
        _isLoadingAvailability = false;
      });
    }
  }

  Widget _buildAnyVetOption() {
    final selected = _vetId == null;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () {
          setState(() {
            _vet = 'Any available vet';
            _vetId = null;
          });
          _loadAvailability();
        },
        borderRadius: BorderRadius.circular(18),
        child: Container(
          height: 72,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: selected ? const Color(0xFF55D6E5) : AppTheme.border,
              width: selected ? 3 : 1,
            ),
          ),
          child: Row(
            children: [
              CircleAvatar(
                radius: 21,
                backgroundColor: selected
                    ? const Color(0xFFDBF5F8)
                    : const Color(0xFFF0F1F2),
                child: const Text(
                  'Any',
                  style: TextStyle(
                    color: AppTheme.primary,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              const SizedBox(width: 14),
              const Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Any available vet',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.heading,
                      ),
                    ),
                    Text(
                      'Fastest · we assign the first open vet',
                      style: TextStyle(fontSize: 12, color: AppTheme.muted),
                    ),
                  ],
                ),
              ),
              _buildSelectionIndicator(selected),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSelectionIndicator(bool selected) {
    return Container(
      width: 24,
      height: 24,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(
          color: selected ? AppTheme.primary : const Color(0xFF9CA9B5),
          width: 2,
        ),
      ),
      child: selected
          ? const Center(
              child: CircleAvatar(radius: 6, backgroundColor: AppTheme.primary),
            )
          : null,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: appointmentAppBar(
        context,
        title: 'Check Availability',
        showBack: true,
      ),
      body: SafeArea(
        top: false,
        child: Column(
          children: [
            const AppointmentProgress(step: 2, label: 'Step 2 of 2'),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        vertical: 16,
                        horizontal: 14,
                      ),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: AppTheme.border),
                      ),
                      child: Row(
                        children: [
                          const Expanded(
                            child: Text(
                              'November 2026',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                                color: AppTheme.heading,
                              ),
                            ),
                          ),
                          Text(
                            '${widget.procedure} · ${widget.pet}',
                            style: const TextStyle(
                              fontSize: 13,
                              color: AppTheme.muted,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),
                    Container(
                      height: 82,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: AppTheme.border),
                      ),
                      child: Row(
                        children: List.generate(_dates.length, (index) {
                          final selected = index == _dateIndex;
                          return Expanded(
                            child: InkWell(
                              onTap: () {
                                setState(() => _dateIndex = index);
                                _loadAvailability();
                              },
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    _dates[index].$1,
                                    style: const TextStyle(
                                      fontSize: 13,
                                      color: AppTheme.muted,
                                    ),
                                  ),
                                  const SizedBox(height: 5),
                                  Container(
                                    width: 46,
                                    height: 46,
                                    alignment: Alignment.center,
                                    decoration: BoxDecoration(
                                      color: selected
                                          ? AppTheme.primary
                                          : Colors.transparent,
                                      borderRadius: BorderRadius.circular(14),
                                    ),
                                    child: Text(
                                      _dates[index].$2,
                                      style: TextStyle(
                                        fontSize: 20,
                                        fontWeight: FontWeight.w800,
                                        color: selected
                                            ? Colors.white
                                            : AppTheme.heading,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        }),
                      ),
                    ),
                    const SizedBox(height: 24),
                    const AppointmentSectionLabel('PREFERRED VET'),
                    const SizedBox(height: 14),
                    _buildAnyVetOption(),
                    ..._vets.map((vet) {
                      final selected = _vetId == vet.vetId;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: InkWell(
                          onTap: () {
                            setState(() {
                              _vet = vet.name;
                              _vetId = vet.vetId;
                            });
                            _loadAvailability();
                          },
                          borderRadius: BorderRadius.circular(18),
                          child: Container(
                            height: 72,
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(18),
                              border: Border.all(
                                color: selected
                                    ? const Color(0xFF55D6E5)
                                    : AppTheme.border,
                                width: selected ? 3 : 1,
                              ),
                            ),
                            child: Row(
                              children: [
                                CircleAvatar(
                                  radius: 21,
                                  backgroundColor: selected
                                      ? const Color(0xFFDBF5F8)
                                      : const Color(0xFFF0F1F2),
                                  child: Text(
                                    vet.name
                                        .split(' ')
                                        .skip(1)
                                        .map((e) => e[0])
                                        .take(2)
                                        .join(),
                                    style: const TextStyle(
                                      color: AppTheme.primary,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        vet.name,
                                        style: const TextStyle(
                                          fontSize: 15,
                                          fontWeight: FontWeight.w800,
                                          color: AppTheme.heading,
                                        ),
                                      ),
                                      const Text(
                                        'Select a specific veterinarian',
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: AppTheme.muted,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Container(
                                  width: 24,
                                  height: 24,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                      color: selected
                                          ? AppTheme.primary
                                          : const Color(0xFF9CA9B5),
                                      width: 2,
                                    ),
                                  ),
                                  child: selected
                                      ? const Center(
                                          child: CircleAvatar(
                                            radius: 6,
                                            backgroundColor: AppTheme.primary,
                                          ),
                                        )
                                      : null,
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }),
                    const SizedBox(height: 12),
                    const AppointmentSectionLabel('TIME SLOTS · ANY VET'),
                    const SizedBox(height: 14),
                    if (_isLoadingAvailability)
                      const Center(child: CircularProgressIndicator())
                    else if (_availabilityError != null)
                      Row(
                        children: [
                          const Expanded(
                            child: Text(
                              'Unable to load available times.',
                              style: TextStyle(color: AppTheme.muted),
                            ),
                          ),
                          TextButton(
                            onPressed: _loadAvailability,
                            child: const Text('Retry'),
                          ),
                        ],
                      )
                    else
                      Wrap(
                        spacing: 10,
                        runSpacing: 10,
                        children: _slots.map((slot) {
                          final selected = _time == slot.display;
                          return SizedBox(
                            width: (MediaQuery.sizeOf(context).width - 50) / 2,
                            height: 46,
                            child: OutlinedButton(
                              onPressed: slot.isBooked
                                  ? null
                                  : () => setState(() => _time = slot.display),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: selected
                                    ? AppTheme.primary
                                    : AppTheme.heading,
                                disabledForegroundColor: const Color(
                                  0xFFBFC8CC,
                                ),
                                side: BorderSide(
                                  color: selected
                                      ? AppTheme.primary
                                      : AppTheme.border,
                                  width: selected ? 2 : 1,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(14),
                                ),
                              ),
                              child: Text(
                                slot.display,
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    const SizedBox(height: 14),
                    const Text(
                      'Greyed slots have no vet free. The assigned vet appears in your booking details.',
                      style: TextStyle(
                        fontSize: 14,
                        height: 1.45,
                        color: AppTheme.muted,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            AppointmentBottomButton(
              label: 'Book Now',
              onTap: _time == null
                  ? null
                  : () => Navigator.push(
                      context,
                      MaterialPageRoute<void>(
                        builder: (_) => AppointmentSummaryScreen(
                          pet: widget.pet,
                          procedure: widget.procedure,
                          veterinarian: _vet == 'Any available vet'
                              ? 'Dr. Rachel Carter'
                              : _vet,
                          time: _time!,
                          petId: widget.petId,
                          serviceId: widget.serviceId,
                          vetId: _vetId,
                          timeslotId: _selectedTimeslot?.timeslotId,
                          date:
                              '${_dates[_dateIndex].$1}, Nov ${_dates[_dateIndex].$2}',
                        ),
                      ),
                    ),
              margin: 20,
            ),
          ],
        ),
      ),
    );
  }
}

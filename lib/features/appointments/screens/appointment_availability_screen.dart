import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_theme.dart';
import '../data/appointment_service.dart';
import '../widgets/appointment_widgets.dart';
import 'appointment_summary_screen.dart';
import 'recommended_schedules_screen.dart';

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
  String? _unavailableTime;
  late DateTime _selectedDate;
  List<AppointmentTimeslot> _slots = const [];
  Object? _availabilityError;
  bool _isLoadingAvailability = false;

  List<AppointmentVeterinarian> _vets = const [];
  AppointmentTimeslot? get _selectedTimeslot {
    for (final slot in _slots) {
      if (slot.display == _time) return slot;
    }
    return null;
  }

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _selectedDate = DateTime(now.year, now.month, now.day);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadVeterinarians();
    });
  }

  DateTime get _maximumDate {
    final now = DateTime.now();
    return DateTime(now.year, now.month + 3, now.day);
  }

  List<DateTime> get _dateStrip {
    final dates = <DateTime>[];
    final maximum = _maximumDate;
    var start = _selectedDate.isBefore(DateTime.now())
        ? DateTime.now()
        : _selectedDate;
    start = DateTime(start.year, start.month, start.day);
    for (var offset = 0; dates.length < 6; offset++) {
      final date = start.add(Duration(days: offset));
      if (date.isAfter(maximum)) break;
      dates.add(date);
    }
    return dates;
  }

  String _weekday(DateTime date) {
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return weekdays[date.weekday - 1];
  }

  String _monthName(DateTime date) {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return months[date.month - 1];
  }

  String _displayDate(DateTime date) =>
      '${_weekday(date)}, ${_monthName(date).substring(0, 3)} ${date.day}, ${date.year}';

  Future<void> _openCalendar() async {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final selected = await showDatePicker(
      context: context,
      initialDate: _selectedDate.isBefore(today) ? today : _selectedDate,
      firstDate: today,
      lastDate: _maximumDate,
      helpText: 'SELECT APPOINTMENT DATE',
    );
    if (selected == null) return;
    setState(() {
      _selectedDate = selected;
      _time = null;
      _unavailableTime = null;
    });
    _loadAvailability();
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
      _unavailableTime = null;
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
                          Expanded(
                            child: Text(
                              '${_monthName(_selectedDate)} ${_selectedDate.year}',
                              style: const TextStyle(
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
                          IconButton(
                            onPressed: _openCalendar,
                            tooltip: 'Open calendar',
                            icon: const Icon(
                              Icons.calendar_month_outlined,
                              color: AppTheme.primaryDark,
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
                        children: _dateStrip.map((date) {
                          final selected =
                              date.year == _selectedDate.year &&
                              date.month == _selectedDate.month &&
                              date.day == _selectedDate.day;
                          return Expanded(
                            child: InkWell(
                              onTap: () {
                                setState(() {
                                  _selectedDate = date;
                                  _time = null;
                                  _unavailableTime = null;
                                });
                                _loadAvailability();
                              },
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    _weekday(date),
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
                                      '${date.day}',
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
                        }).toList(),
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
                              onPressed: () => setState(() {
                                if (slot.isBooked) {
                                  _time = null;
                                  _unavailableTime = slot.display;
                                } else {
                                  _time = slot.display;
                                  _unavailableTime = null;
                                }
                              }),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: selected
                                    ? AppTheme.primary
                                    : AppTheme.heading,
                                side: BorderSide(
                                  color: selected
                                      ? AppTheme.primary
                                      : AppTheme.border,
                                  width: selected ? 2 : 1,
                                ),
                                backgroundColor: slot.isBooked
                                    ? const Color(0xFFFAFAFA)
                                    : Colors.white,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(14),
                                ),
                              ),
                              child: Text(
                                slot.display,
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w800,
                                  color: slot.isBooked
                                      ? const Color(0xFFBFC7CC)
                                      : null,
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    const SizedBox(height: 14),
                    if (_unavailableTime != null) ...[
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFFBF0),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFE7D8A6)),
                        ),
                        child: Text(
                          'Preferred time $_unavailableTime is unavailable. Tap Show Recommended Schedules to see alternatives.',
                          style: const TextStyle(
                            fontSize: 14,
                            height: 1.35,
                            color: Color(0xFF7B6438),
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),
                    ],
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
              label: _unavailableTime != null
                  ? 'Show Recommended Schedules'
                  : 'Book Now',
              onTap: _unavailableTime != null
                  ? () => Navigator.push(
                      context,
                      MaterialPageRoute<void>(
                        builder: (_) => RecommendedSchedulesScreen(
                          pet: widget.pet,
                          procedure: widget.procedure,
                          preferredDate: _displayDate(_selectedDate),
                          preferredTime: _unavailableTime!,
                          veterinarian: _vet,
                          petId: widget.petId,
                          serviceId: widget.serviceId,
                          preferredVetId: _vetId,
                          algorithmDate:
                              '${_selectedDate.year}-${_selectedDate.month.toString().padLeft(2, '0')}-${_selectedDate.day.toString().padLeft(2, '0')}',
                        ),
                      ),
                    )
                  : _time == null
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
                          date: _displayDate(_selectedDate),
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

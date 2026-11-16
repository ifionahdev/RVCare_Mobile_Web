import 'package:flutter_test/flutter_test.dart';
import 'package:rvcare/features/appointments/data/appointment_service.dart';

void main() {
  const slot = AppointmentTimeslot(
    timeslotId: 1,
    startTime: '10:30:00',
    endTime: '11:00:00',
    display: '10:30 AM',
    isBooked: false,
  );

  test('marks a slot at or before now as past on the selected day', () {
    final date = DateTime(2026, 11, 3);

    expect(slot.isPastOn(date, now: DateTime(2026, 11, 3, 10, 30)), isTrue);
    expect(slot.isPastOn(date, now: DateTime(2026, 11, 3, 10, 31)), isTrue);
  });

  test('keeps future slots and slots on other days available', () {
    final date = DateTime(2026, 11, 3);

    expect(slot.isPastOn(date, now: DateTime(2026, 11, 3, 10, 29)), isFalse);
    expect(
      slot.isPastOn(
        date.add(const Duration(days: 1)),
        now: DateTime(2026, 11, 3, 12),
      ),
      isFalse,
    );
  });
}

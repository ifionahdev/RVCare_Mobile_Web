import 'package:flutter_test/flutter_test.dart';

import 'package:rvcare/features/settings/data/settings_service.dart';

void main() {
  test('parses the customer profile response shape', () {
    final profile = CustomerSettingsProfile.fromJson({
      'ownerId': 4,
      'accountId': 9,
      'account': {
        'firstName': 'Alex',
        'lastName': 'Morgan',
        'dateOfBirth': '2000-02-29T00:00:00.000Z',
      },
    });

    expect(profile.firstName, 'Alex');
    expect(profile.lastName, 'Morgan');
    expect(profile.dateOfBirth, DateTime.utc(2000, 2, 29));
  });

  test('parses activity rows returned by the customer activity endpoint', () {
    final activity = AccountActivity.fromJson({
      'id': 'audit-7',
      'title': 'Account details updated',
      'detail': 'Account details updated by you.',
      'createdAt': '2026-11-03T10:25:00.000Z',
    });

    expect(activity.id, 'audit-7');
    expect(activity.title, 'Account details updated');
    expect(activity.createdAt, DateTime.utc(2026, 11, 3, 10, 25));
  });
}

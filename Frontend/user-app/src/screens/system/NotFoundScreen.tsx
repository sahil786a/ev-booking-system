import { useNavigation } from '@react-navigation/native';
import React from 'react';

import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Screen from '../../components/common/Screen';
import EmptyState from '../../components/common/EmptyState';

export default function NotFoundScreen(): JSX.Element {
  const navigation = useNavigation();

  return (
    <Screen>
      <Card>
        <EmptyState
          title="That link is out of range"
          subtitle="The station, booking, or route you opened is missing on the server."
        />
        <Button title="Go back" variant="secondary" onPress={() => navigation.goBack()} />
      </Card>
    </Screen>
  );
}

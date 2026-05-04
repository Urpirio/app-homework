/**
 * Tests for EmptyState component
 *
 * Validates: Requirements 4.7, 10.5
 */

import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { useColorScheme } from 'react-native';

import { EmptyState } from '../EmptyState';

jest.mock('react-native/Libraries/Utilities/useColorScheme');

const mockedUseColorScheme = useColorScheme as jest.MockedFunction<typeof useColorScheme>;

describe('EmptyState', () => {
  beforeEach(() => {
    mockedUseColorScheme.mockReturnValue('dark');
  });

  it('should display the title and message', () => {
    const { getByText } = render(
      <EmptyState icon="book-outline" title="No Books" message="Your library is empty." />,
    );
    expect(getByText('No Books')).toBeTruthy();
    expect(getByText('Your library is empty.')).toBeTruthy();
  });

  it('should show the action button when actionLabel and onAction are provided', () => {
    const onAction = jest.fn();
    const { getByText } = render(
      <EmptyState
        icon="add-circle-outline"
        title="No Tasks"
        message="Create your first task."
        actionLabel="Create Task"
        onAction={onAction}
      />,
    );
    const button = getByText('Create Task');
    expect(button).toBeTruthy();
    fireEvent.press(button);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('should not show the action button when actionLabel is missing', () => {
    const { queryByText } = render(
      <EmptyState icon="book-outline" title="No Books" message="Your library is empty." />,
    );
    expect(queryByText('Create Task')).toBeNull();
  });

  it('should not show the action button when onAction is missing', () => {
    const { queryByText } = render(
      <EmptyState
        icon="book-outline"
        title="No Books"
        message="Your library is empty."
        actionLabel="Browse"
      />,
    );
    expect(queryByText('Browse')).toBeNull();
  });

  it('should render with light theme', () => {
    mockedUseColorScheme.mockReturnValue('light');
    const { getByText } = render(
      <EmptyState icon="book-outline" title="No Books" message="Your library is empty." />,
    );
    expect(getByText('No Books')).toBeTruthy();
  });
});

/**
 * Tests for SkeletonLoader component
 *
 * Validates: Requirements 4.7, 10.5
 */

import { render } from '@testing-library/react-native';
import React from 'react';
import { useColorScheme } from 'react-native';

import { SkeletonLoader } from '../SkeletonLoader';

jest.mock('react-native/Libraries/Utilities/useColorScheme');

const mockedUseColorScheme = useColorScheme as jest.MockedFunction<typeof useColorScheme>;

describe('SkeletonLoader', () => {
  beforeEach(() => {
    mockedUseColorScheme.mockReturnValue('dark');
  });

  it('should render the default number of rows (3)', () => {
    const { getByLabelText } = render(<SkeletonLoader />);
    const container = getByLabelText('Loading content');
    // 3 rows by default
    expect(container.children).toHaveLength(3);
  });

  it('should render the specified number of rows', () => {
    const { getByLabelText } = render(<SkeletonLoader rows={5} />);
    const container = getByLabelText('Loading content');
    expect(container.children).toHaveLength(5);
  });

  it('should render list-item variant by default', () => {
    const { getByLabelText } = render(<SkeletonLoader rows={1} />);
    expect(getByLabelText('Loading content')).toBeTruthy();
  });

  it('should render card variant', () => {
    const { getByLabelText } = render(<SkeletonLoader rows={2} variant="card" />);
    expect(getByLabelText('Loading content').children).toHaveLength(2);
  });

  it('should render detail variant', () => {
    const { getByLabelText } = render(<SkeletonLoader rows={1} variant="detail" />);
    expect(getByLabelText('Loading content').children).toHaveLength(1);
  });

  it('should render with light theme', () => {
    mockedUseColorScheme.mockReturnValue('light');
    const { getByLabelText } = render(<SkeletonLoader rows={1} />);
    expect(getByLabelText('Loading content')).toBeTruthy();
  });
});

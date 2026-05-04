/**
 * Tests for AnalyticsPanel component
 *
 * Validates: Requirements 14.6, 14.7
 */

import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

// ─── Mocks ───────────────────────────────────────────────────────────────────

// Mock react-native-chart-kit — the charts rely on native SVG which isn't
// available in the test environment, so we render lightweight placeholders.
jest.mock('react-native-chart-kit', () => {
  const { View, Text } = require('react-native');
  return {
    LineChart: (props: any) => (
      <View testID="line-chart">
        <Text>{JSON.stringify(props.data.labels)}</Text>
      </View>
    ),
    BarChart: (props: any) => (
      <View testID="bar-chart">
        <Text>{JSON.stringify(props.data.labels)}</Text>
      </View>
    ),
    PieChart: (props: any) => (
      <View testID="pie-chart">
        <Text>{props.data.map((d: any) => d.name).join(',')}</Text>
      </View>
    ),
  };
});

jest.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        background: '#000000',
        foreground: '#FFFFFF',
        primary: '#0A84FF',
        secondary: '#5E5CE6',
        border: '#38383A',
        error: '#FF453A',
        success: '#32D74B',
        text: '#FFFFFF',
        textSecondary: '#AEAEB2',
        inputBackground: '#1C1C1E',
        primaryLight: '#003A75',
        surface: '#121212',
        card: '#1C1C1E',
      },
      spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
      borderRadius: { sm: 4, md: 8, lg: 16 },
      shadows: { sm: {}, md: {}, lg: {} },
    },
    isDark: true,
  }),
}));

jest.mock('@/hooks/useInstitution', () => ({
  useInstitution: () => ({
    institutionId: 'inst-1',
    setInstitutionId: jest.fn(),
  }),
}));

import { AnalyticsData, AnalyticsPanel } from '../AnalyticsPanel';

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AnalyticsPanel', () => {
  it('renders with placeholder data when no data prop is provided', () => {
    const { getByText, getByTestId } = render(<AnalyticsPanel />);

    // Header
    expect(getByText('Analíticas')).toBeTruthy();
    expect(getByText('Métricas e indicadores institucionales')).toBeTruthy();

    // Date range chips
    expect(getByText('7 días')).toBeTruthy();
    expect(getByText('30 días')).toBeTruthy();
    expect(getByText('90 días')).toBeTruthy();
    expect(getByText('Personalizado')).toBeTruthy();

    // KPI cards
    expect(getByText('Tiempo Respuesta')).toBeTruthy();
    expect(getByText('Tasa de Entregas')).toBeTruthy();
    expect(getByText('Engagement')).toBeTruthy();

    // Charts rendered
    expect(getByTestId('line-chart')).toBeTruthy();
    expect(getByTestId('bar-chart')).toBeTruthy();
    expect(getByTestId('pie-chart')).toBeTruthy();

    // Chart titles
    expect(getByText('Tendencia de Inscripciones')).toBeTruthy();
    expect(getByText('Distribución de Calificaciones')).toBeTruthy();
    expect(getByText('Estado de Tareas')).toBeTruthy();
  });

  it('renders with custom analytics data', () => {
    const customData: AnalyticsData = {
      enrollmentTrend: {
        labels: ['Q1', 'Q2'],
        data: [50, 80],
      },
      gradeDistribution: {
        labels: ['A', 'B', 'C'],
        data: [10, 20, 15],
      },
      taskCompletion: { todo: 10, inProgress: 20, done: 70 },
      kpis: {
        avgResponseTime: 5,
        submissionRate: 95,
        engagementScore: 88,
      },
    };

    const { getByText } = render(<AnalyticsPanel data={customData} />);

    // KPI values from custom data
    expect(getByText('Tiempo Respuesta')).toBeTruthy();
    expect(getByText('Tasa de Entregas')).toBeTruthy();
    expect(getByText('Engagement')).toBeTruthy();
  });

  it('calls onDateRangeChange when a date range chip is pressed', () => {
    const onDateRangeChange = jest.fn();
    const { getByText } = render(
      <AnalyticsPanel onDateRangeChange={onDateRangeChange} />,
    );

    fireEvent.press(getByText('7 días'));
    expect(onDateRangeChange).toHaveBeenCalledWith('7d');

    fireEvent.press(getByText('90 días'));
    expect(onDateRangeChange).toHaveBeenCalledWith('90d');
  });

  it('shows correct task completion percentages', () => {
    const data: AnalyticsData = {
      enrollmentTrend: { labels: ['A'], data: [1] },
      gradeDistribution: { labels: ['A'], data: [1] },
      taskCompletion: { todo: 25, inProgress: 25, done: 50 },
      kpis: { avgResponseTime: 10, submissionRate: 50, engagementScore: 50 },
    };

    const { getByText } = render(<AnalyticsPanel data={data} />);

    expect(getByText(/Pendiente 25%/)).toBeTruthy();
    expect(getByText(/En Progreso 25%/)).toBeTruthy();
    expect(getByText(/Completado 50%/)).toBeTruthy();
  });
});

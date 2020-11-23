import React from 'react';
import { Slider } from '@grafana/ui';
import { dateTime, DateTime } from '@grafana/data';

interface Props {
  min: DateTime;
  max: DateTime;
  mode: 'range' | 'snapshot';
  timeValues?: number[];
  onChange?: (value: number[] | null) => void;
}

function findClosestValue(value: number, possibilities: number[]) {
  let closest = possibilities[0];
  for (let i = 1; i < possibilities.length; i++) {
    if (Math.abs(value - possibilities[i]) < Math.abs(value - closest)) {
      closest = possibilities[i];
    }
  }
  return closest;
}

export class TimeSlider extends React.PureComponent<Props, never> {
  static defaultTimeSnapshot = [0];
  static defaultTimeRange = [0, 0];

  handleChange = (values: number[]) => {
    if (this.props.mode === 'snapshot') {
      if (!this.props.timeValues || this.props.timeValues.length <= 0) {
        this.props.onChange?.(null);
        return;
      }

      const value = values[0];
      const closestValue = findClosestValue(value, this.props.timeValues);
      this.props.onChange?.([closestValue]);
    } else {
      this.props.onChange?.(values);
    }
  };

  formatTooltip = (value: number) => {
    return dateTime(value).fromNow();
  };

  render() {
    return (
      <Slider
        key={this.props.mode}
        min={this.props.min.valueOf()}
        max={this.props.max.valueOf()}
        value={this.props.mode === 'snapshot' ? TimeSlider.defaultTimeSnapshot : TimeSlider.defaultTimeRange}
        onChange={this.handleChange}
        formatTooltipResult={this.formatTooltip}
        tooltipAlwaysVisible={false}
      />
    );
  }
}

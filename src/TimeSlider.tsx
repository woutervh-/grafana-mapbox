import React from 'react';
import { Slider } from '@grafana/ui';
import { dateTime, DateTime } from '@grafana/data';

interface Props {
  min: DateTime;
  max: DateTime;
  timeValues: number[] | undefined;
  onChange?: (value: number | null) => void;
}

export class TimeSlider extends React.PureComponent<Props, never> {
  static defaultValue = [0];

  handleChange = (values: number[]) => {
    if (!this.props.timeValues || this.props.timeValues.length <= 0) {
      this.props.onChange?.(null);
      return;
    }
    const value = values[0];
    let closestValue = this.props.timeValues[0];
    for (let i = 1; i < this.props.timeValues.length; i++) {
      if (Math.abs(value - this.props.timeValues[i]) < Math.abs(value - closestValue)) {
        closestValue = this.props.timeValues[i];
      }
    }
    this.props.onChange?.(closestValue);
  };

  formatTooltip = (value: number) => {
    return dateTime(value).fromNow();
  };

  render() {
    return (
      <Slider
        min={this.props.min.valueOf()}
        max={this.props.max.valueOf()}
        value={TimeSlider.defaultValue}
        onChange={this.handleChange}
        formatTooltipResult={this.formatTooltip}
        tooltipAlwaysVisible={false}
      />
    );
  }
}

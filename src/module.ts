import { PanelPlugin } from '@grafana/data';
import { MapboxPanelOptions } from './types';
import { MapboxPanel } from './MapboxPanel';

export const plugin = new PanelPlugin<MapboxPanelOptions>(MapboxPanel).setPanelOptions(builder => {
  return builder
    .addTextInput({
      path: 'style-url',
      name: 'Style URL',
      description: 'URL (remote or data-url) to the Mapbox base style in JSON format',
      category: ['Base map'],
      defaultValue: 'data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjo4LCJzb3VyY2VzIjp7Im9zbSI6eyJ0eXBlIjoicmFzdGVyIiwidGlsZXMiOlsiaHR0cHM6Ly9hLnRpbGUub3BlbnN0cmVldG1hcC5vcmcve3p9L3t4fS97eX0ucG5nIiwiaHR0cHM6Ly9iLnRpbGUub3BlbnN0cmVldG1hcC5vcmcve3p9L3t4fS97eX0ucG5nIiwiaHR0cHM6Ly9jLnRpbGUub3BlbnN0cmVldG1hcC5vcmcve3p9L3t4fS97eX0ucG5nIl0sInRpbGVTaXplIjoyNTZ9fSwibGF5ZXJzIjpbeyJ0eXBlIjoicmFzdGVyIiwiaWQiOiJvc20iLCJzb3VyY2UiOiJvc20ifV0sImF0dHJpYnV0aW9uIjoiqSBPcGVuU3RyZWV0TWFwIGNvbnRyaWJ1dG9ycyJ9'
    })
    .addTextInput({
      path: 'time-column-name',
      name: 'Time column name',
      description: 'Name of the column which contains the time values of the series',
      category: ['Data selection'],
      defaultValue: 'time'
    })
    .addSelect({
      name: 'Location data',
      path: 'selection',
      description: 'Choose how to select geometry from the data source',
      settings: {
        options: [
          { label: 'WKT', value: 'wkt', description: 'Select WKT from data source' },
          { label: 'Geo-coordinate', value: 'geo-coordinate', description: 'Select geo-coordinate (latitude, longitude) from data source' }
        ]
      },
      category: ['Data selection'],
      defaultValue: 'wkt'
    })
    .addTextInput({
      path: 'wkt-column-name',
      name: 'WKT column name',
      description: 'Name of the column which contains the WKT values of the series',
      category: ['Data selection'],
      defaultValue: 'wkt',
      showIf: (config) => config.selection === 'wkt'
    })
    .addTextInput({
      path: 'latitude-column-name',
      name: 'Latitude column name',
      description: 'Name of the column which contains the latitude of the geo-coordinate',
      category: ['Data selection'],
      defaultValue: 'lat',
      showIf: (config) => config.selection === 'geo-coordinate'
    })
    .addTextInput({
      path: 'longitude-column-name',
      name: 'Longitude column name',
      description: 'Name of the column which contains the longitude of the geo-coordinate',
      category: ['Data selection'],
      defaultValue: 'lon',
      showIf: (config) => config.selection === 'geo-coordinate'
    })
    .addSelect({
      path: 'time-option',
      name: 'Time selection',
      description: 'Choose which geometry is shown on the map by applying time filtering',
      settings: {
        options: [
          { label: 'Time range', value: 'time-range', description: 'Display geometry within time ranges' },
          { label: 'Snapshots', value: 'snapshots', description: 'Display snapshots of geometry at specific times' }
        ]
      },
      category: ['Data selection'],
      defaultValue: 'time-range'
    })
    .addBooleanSwitch({
      path: 'show-circles',
      name: 'Show circles',
      description: 'Indicate whether or not the parsed WKT is displayed as circles',
      category: ['Display'],
      defaultValue: true
    })
    .addBooleanSwitch({
      path: 'show-lines',
      name: 'Show lines',
      description: 'Indicate whether or not the parsed WKT is displayed as lines',
      category: ['Display'],
      defaultValue: true,
      showIf: (config) => config.selection === 'wkt'
    });
});

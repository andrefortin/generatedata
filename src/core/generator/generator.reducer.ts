import { AnyAction } from 'redux';
import { generate } from 'shortid';
// @ts-ignore-line
import config from '../../../build/config.client';
import * as actions from './generator.actions';
import { BuilderLayout } from '../../components/builder/Builder.component';
import { ExportSettingsTab } from '../../components/exportSettings/ExportSettings.types';
import { DataTypeFolder, ExportTypeFolder } from '../../_plugins';
import { GDLocale } from '../../../types/general';
import { dataTypeNames } from '../../utils/dataTypeUtils';
import { exportTypeNames } from '../../utils/exportTypeUtils';

export type DataRow = {
	id: string;
	title: string;
	dataType: string | null;
	data: any;
};

export type DataRows = {
	[id: string]: DataRow;
};

export type PreviewData = {
	[id: string]: any[];
};

// we store all settings separately so in case a user switches from one to another, the previous settings aren't
// wiped out
export type ExportTypeSettings = {
	[exportType in ExportTypeFolder]: any;
}

export type GeneratorState = {
	localeFileLoaded: boolean;
	locale: GDLocale;
	loadedDataTypes: {
		[str in DataTypeFolder]: boolean;
	};
	loadedExportTypes: {
		[str in ExportTypeFolder]: boolean;
	};
	exportType: string;
	rows: DataRows;
	sortedRows: string[];
	showGrid: boolean;
	showPreview: boolean;
	builderLayout: BuilderLayout;
	showExportSettings: boolean;
	exportTypeSettings: Partial<ExportTypeSettings>;
	showGenerationPanel: boolean;
	showRowNumbers: boolean;
	enableLineWrapping: boolean;
	theme: string;
	previewTextSize: number;
	generatedPreviewData: PreviewData;
	exportSettingsTab: ExportSettingsTab;
	numGenerationRows: number;
	numPreviewRows: number;
	stripWhitespace: boolean;
};

/**
 * This houses the content of the generator. The actual content of each row is dependent based on the
 * Data Type: they can choose to store whatever info in whatever format they want. So this is kind of like a frame.
 */
export const reducer = (state: GeneratorState = {
	localeFileLoaded: false,
	locale: 'en',
	loadedDataTypes: dataTypeNames.reduce((acc: any, name: DataTypeFolder) => ({ ...acc, [name]: false }), {}),
	loadedExportTypes: exportTypeNames.reduce((acc: any, name: ExportTypeFolder) => ({ ...acc, [name]: false }), {}),
	exportType: config.defaultExportType,
	rows: {},
	sortedRows: [],
	showGrid: true,
	showPreview: true,
	builderLayout: 'horizontal',
	showExportSettings: false,
	exportTypeSettings: {},
	numPreviewRows: 5,
	showRowNumbers: false,
	enableLineWrapping: true,
	theme: 'lucario',
	previewTextSize: 12,
	generatedPreviewData: {},
	exportSettingsTab: 'exportType',
	showGenerationPanel: false,
	numGenerationRows: 100,
	stripWhitespace: false
}, action: AnyAction): GeneratorState => {
	switch (action.type) {
		case [actions.setLocaleFileLoaded]:
			return {
				...state,
				locale: action.payload.locale,
				localeFileLoaded: true
			};

		case [actions.dataTypeLoaded]:
			return {
				...state,
				loadedDataTypes: {
					...state.loadedDataTypes,
					[action.payload.dataType]: true
				}
			};

		case [actions.exportTypeLoaded]:
			return {
				...state,
				loadedExportTypes: {
					...state.loadedExportTypes,
					[action.payload.exportType]: true
				},
				exportTypeSettings: {
					...state.exportTypeSettings,
					[action.payload.exportType]: action.payload.initialState
				}
			};

		case [actions.addRows]: {
			const newRows: DataRows = {};
			const newRowIDs: string[] = [];
			for (let i = 0; i < action.payload.numRows; i++) {
				const rowId = generate();
				newRows[rowId] = {
					id: rowId,
					title: '',
					dataType: null,
					data: null
				};
				newRowIDs.push(rowId);
			}

			return {
				...state,
				rows: {
					...state.rows,
					...newRows
				},
				sortedRows: [
					...state.sortedRows,
					...newRowIDs
				]
			};
		}

		case [actions.removeRow]: {
			const trimmedRowIds = state.sortedRows.filter((i) => i !== action.payload.id);
			const updatedRows: DataRows = {};
			trimmedRowIds.forEach((id) => {
				updatedRows[id] = state.rows[id];
			});
			return {
				...state,
				rows: updatedRows,
				sortedRows: trimmedRowIds
			};
		}

		case [actions.onChangeTitle]:
			return {
				...state,
				rows: {
					...state.rows,
					[action.payload.id]: {
						...state.rows[action.payload.id],
						title: action.payload.value
					}
				}
			};

		case actions.SELECT_DATA_TYPE: {
			const { id, value, data } = action.payload;
			return {
				...state,
				rows: {
					...state.rows,
					[id]: {
						...state.rows[id],
						dataType: value,
						data
					}
				}
			};
		}

		case actions.SELECT_EXPORT_TYPE: {
			return {
				...state,
				exportType: action.payload.exportType
			};
		}

		case actions.REFRESH_PREVIEW_DATA: {
			return {
				...state,
				generatedPreviewData: {
					...state.generatedPreviewData,
					...action.payload.previewData
				}
			};
		}

		case actions.CONFIGURE_DATA_TYPE:
			return {
				...state,
				rows: {
					...state.rows,
					[action.payload.id]: {
						...state.rows[action.payload.id],
						data: action.payload.data
					}
				},
			};

		case [actions.configureExportType]: {
			return {
				...state,
				exportTypeSettings: {
					...state.exportTypeSettings,
					[state.exportType]: action.payload.data
				}
			};
		}

		case [actions.repositionRow]: {
			const newArray = state.sortedRows.filter((i) => i !== action.payload.id);
			newArray.splice(action.payload.newIndex, 0, action.payload.id);
			return {
				...state,
				sortedRows: newArray
			};
		}

		case [actions.toggleGrid]: {
			const newState = {
				...state,
				showGrid: !state.showGrid
			};
			if (!state.showPreview) {
				newState.showPreview = true;
			}
			return newState;
		}

		case [actions.togglePreview]: {
			const newState = {
				...state,
				showPreview: !state.showPreview
			};
			if (!state.showGrid) {
				newState.showGrid = true;
			}
			return newState;
		}

		case [actions.toggleLayout]:
			return {
				...state,
				builderLayout: state.builderLayout === 'horizontal' ? 'vertical' : 'horizontal'
			};

		case [actions.toggleLineWrapping]:
			return {
				...state,
				enableLineWrapping: !state.enableLineWrapping
			};

		case [actions.updateNumPreviewRows]:
			return {
				...state,
				numPreviewRows: action.payload.numRows
			};

		case [actions.changeTheme]:
			return {
				...state,
				theme: action.payload.theme
			};

		case [actions.toggleShowRowNumbers]:
			return {
				...state,
				showRowNumbers: !state.showRowNumbers
			};

		case [actions.setPreviewTextSize]:
			return {
				...state,
				previewTextSize: action.payload.previewTextSize
			};

		case [actions.toggleExportSettings]: {
			const newState = {
				...state,
				showExportSettings: !state.showExportSettings
			};
			if (action.payload.tab) {
				newState.exportSettingsTab = action.payload.tab;
			}
			return newState;
		}

		case [actions.showGenerationPanel]:
			return {
				...state,
				showGenerationPanel: true
			};

		case [actions.hideGenerationPanel]:
			return {
				...state,
				showGenerationPanel: false
			};

		case [actions.updateNumGenerationRows]:
			return {
				...state,
				numGenerationRows: action.payload.numGenerationRows
			};

		case [actions.toggleStripWhitespace]:
			return {
				...state,
				stripWhitespace: !action.payload.stripWhitespace
			};

		default:
			return state;
	}
};

export default reducer;

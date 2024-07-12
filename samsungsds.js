const fz = require('zigbee-herdsman-converters/converters/fromZigbee');
const exposes = require('zigbee-herdsman-converters/lib/exposes');
const reporting = require('zigbee-herdsman-converters/lib/reporting');
const e = exposes.presets;
const ea = exposes.access;
const {deviceAddCustomCluster} = require('zigbee-herdsman-converters/lib/modernExtend');
const {logger} = require('zigbee-herdsman-converters/lib/logger');
const {Zcl} = require('zigbee-herdsman');

const NS = 'zhc:samsungsds';

const samsungsdsModernExtend = {
	addCustomClusterClosuresDoorLock: () =>
		deviceAddCustomCluster('closuresDoorLock', {
			ID: 257,
			attributes: {
				lockState: {ID: 0, type: Zcl.DataType.ENUM8},
			},
			commands: {
				samsungUnlockDoor: {
					ID: 31,
					response: 31,
					parameters: [{name: 'data', type: Zcl.BuffaloZclDataType.LIST_UINT8}],
				},
			},
			commandsResponse: {
			},
		}),
};

const tzLocal = {
	sds_lock: {
		key: ['state'],
		convertSet: async (entity, key, value, meta) => {
			if(value == 'UNLOCK') {
				await entity.command('closuresDoorLock',
					'samsungUnlockDoor',
					{'data': [16, 4, 49, 50, 51, 53]},
					{manufacturerCode: Zcl.ManufacturerCode.SAMSUNG, disableDefaultResponse: true, disableResponse: true}
				);
			}
		},
	},
};

const fzLocal = {
	sds_lock: {
		cluster: 'closuresDoorLock',
		type: ['raw'],
		convert: (model, msg, publish, options, meta) => {

			const controlBy = msg.data[3];
			const stateCode = msg.data[4];
			let state = '';
			let lock_state = '';
			let operated_by = '';
			let id = ''

			switch (stateCode) {
				case 2:
					state = 'UNLOCK';
					lock_state = 'unlocked';
					if (controlBy == 0) {
						operated_by = 'Lock Code'
					} else if (controlBy == 4) {
						operated_by = 'Fingerprint'
						id = 'F-' + (msg.data[5] - 30);
					} else if (controlBy == 3) {
						operated_by = 'RFID Tag'
						id = 'R-' + (msg.data[5] - 2);
					} else if (controlBy == 5) {
						operated_by = 'Bluetooth'
					} else if (controlBy == 2) {
						operated_by = 'Manual'
					} else if (controlBy == 1) {
						operated_by = 'Key'
					}
					break;
				case 7:
					state = 'LOCK';
					lock_state = 'locked';
					method = 'Ansimi';
					break;
				case 8:
					state = 'LOCK';
					lock_state = 'locked';
					operated_by = 'Unknown';
					break;
				case 9:
					state = 'UNLOCK';
					lock_state = 'unlocked';
					operated_by = 'Key';
					break;
				case 13:
					state = 'LOCK';
					lock_state = 'locked';
					operated_by = 'Key';
					break;
				case 14:
					state = 'UNLOCK';
					lock_state = 'unlocked';
					operated_by = 'Inside Handle';
					break;
				case 10:
					state = 'LOCK';
					lock_state = 'locked';
					operated_by = 'Auto';
					break;
				case 16:
					state = 'UNLOCK';
					lock_state = 'unlocked';
					operated_by = 'Zigbee';
					break;
			}

			logger.debug("fzLocal.sds_lock.convert stateCode: "+stateCode+", controlBy: "+controlBy, NS);

			if(state) {
				return {
					id: id,
					lock_state: lock_state,
					operated_by: operated_by,
					state: state,
				};
			}
		},
	},
	sds_battery: {
		cluster: 'genPowerCfg',
		type: ['attributeReport', 'readResponse'],
		convert: (model, msg, publish, options, meta) => {
			return {battery: 100}
		},
	}
};

const definitions = [
	{
		zigbeeModel: ['SHP-DXXXX'],
		model: 'SHP-DXXXX',
		vendor: 'SAMSUNG SDS',
		description: 'Samsung SDS Door Lock',
		fingerprint: [{modelID: '', manufacturerName: 'SAMSUNG SDS'}],
		fromZigbee: [
			fzLocal.sds_lock,
			fzLocal.sds_battery,
		],
		toZigbee: [
			tzLocal.sds_lock
		],
		exposes: [
			e.lock(),
			e.battery(),
			e.text('operated_by', ea.STATE).withDescription('How the last state of the door lock was changed.'),
			e.text('id', ea.STATE).withDescription('ID of the key that last changed the state of the door lock.'),
		],
		extend: [
			samsungsdsModernExtend.addCustomClusterClosuresDoorLock(),
		],
		configure: async (device, coordinatorEndpoint) => {
			const endpoint = device.getEndpoint(1);
			await reporting.bind(endpoint, coordinatorEndpoint, ['closuresDoorLock', 'genPowerCfg']);
			await reporting.lockState(endpoint);
			await endpoint.configureReporting('closuresDoorLock', [{attribute: 'lockState', minimumReportInterval: 0, maximumReportInterval: 3600, reportableChange: 0}]);
			device.powerSource = 'Battery';
			device.save();
		},
		onEvent: async (type, data, device, options, state) => {
			logger.debug("onEvent type: "+type+", data: "+JSON.stringify(data), NS);
		}
	}
];

module.exports = definitions;

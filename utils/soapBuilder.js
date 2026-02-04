const xml2js = require('xml2js');

/**
 * Build SOAP envelope for TR-069 RPC methods
 */
class SOAPBuilder {
    constructor() {
        this.builder = new xml2js.Builder({
            xmldec: { version: '1.0', encoding: 'UTF-8' },
            headless: false,
        });

        this.parser = new xml2js.Parser({
            explicitArray: false,
            ignoreAttrs: false,
            mergeAttrs: true,
        });
    }

    /**
     * Parse incoming SOAP request
     */
    async parseSOAPRequest(xml) {
        try {
            const result = await this.parser.parseStringPromise(xml);
            return result;
        } catch (error) {
            console.error('Failed to parse SOAP request:', error);
            throw new Error('Invalid SOAP XML');
        }
    }

    /**
     * Build SOAP envelope wrapper
     */
    buildEnvelope(body, headerContent = null) {
        const envelope = {
            'soap:Envelope': {
                '$': {
                    'xmlns:soap': 'http://schemas.xmlsoap.org/soap/envelope/',
                    'xmlns:xsd': 'http://www.w3.org/2001/XMLSchema',
                    'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
                    'xmlns:cwmp': 'urn:dslforum-org:cwmp-1-0',
                },
            },
        };

        // Add header if provided
        if (headerContent) {
            envelope['soap:Envelope']['soap:Header'] = headerContent;
        }

        // Add body
        envelope['soap:Envelope']['soap:Body'] = body;

        return this.builder.buildObject(envelope);
    }

    /**
     * Build InformResponse
     */
    buildInformResponse() {
        const body = {
            'cwmp:InformResponse': {
                MaxEnvelopes: '1',
            },
        };
        return this.buildEnvelope(body);
    }

    /**
     * Build GetParameterValues request
     */
    buildGetParameterValues(parameters) {
        const paramList = parameters.map((param) => ({ _: param }));

        const body = {
            'cwmp:GetParameterValues': {
                ParameterNames: {
                    'soap:arrayType': `xsd:string[${parameters.length}]`,
                    string: paramList,
                },
            },
        };

        return this.buildEnvelope(body);
    }

    /**
     * Build SetParameterValues request
     */
    buildSetParameterValues(parameters) {
        const paramList = parameters.map((param) => ({
            Name: param.name,
            Value: {
                '$': { 'xsi:type': param.type || 'xsd:string' },
                _: param.value,
            },
        }));

        const body = {
            'cwmp:SetParameterValues': {
                ParameterList: {
                    'soap:arrayType': `cwmp:ParameterValueStruct[${parameters.length}]`,
                    ParameterValueStruct: paramList,
                },
                ParameterKey: '',
            },
        };

        return this.buildEnvelope(body);
    }

    /**
     * Build Download request (for firmware update)
     */
    buildDownload(fileUrl, fileType = '1 Firmware Upgrade Image', fileSize = 0) {
        const body = {
            'cwmp:Download': {
                CommandKey: `download_${Date.now()}`,
                FileType: fileType,
                URL: fileUrl,
                Username: '',
                Password: '',
                FileSize: fileSize,
                TargetFileName: '',
                DelaySeconds: '0',
                SuccessURL: '',
                FailureURL: '',
            },
        };

        return this.buildEnvelope(body);
    }

    /**
     * Build Reboot request
     */
    buildReboot() {
        const body = {
            'cwmp:Reboot': {
                CommandKey: `reboot_${Date.now()}`,
            },
        };

        return this.buildEnvelope(body);
    }

    /**
     * Build GetParameterValuesResponse parser
     */
    parseGetParameterValuesResponse(soapObj) {
        try {
            const body = soapObj['soap:Envelope']['soap:Body'];
            const response = body['cwmp:GetParameterValuesResponse'];
            const paramList = response.ParameterList.ParameterValueStruct;

            // Normalize to array if single parameter
            const params = Array.isArray(paramList) ? paramList : [paramList];

            return params.map((param) => ({
                name: param.Name,
                value: param.Value._,
                type: param.Value['xsi:type'] || 'xsd:string',
            }));
        } catch (error) {
            console.error('Failed to parse GetParameterValuesResponse:', error);
            return [];
        }
    }

    /**
     * Parse Inform message from CPE
     */
    parseInform(soapObj) {
        try {
            const body = soapObj['soap:Envelope']['soap:Body'];
            const inform = body['cwmp:Inform'];

            const deviceId = inform.DeviceId;
            const events = Array.isArray(inform.Event.EventStruct)
                ? inform.Event.EventStruct
                : [inform.Event.EventStruct];

            const paramList = inform.ParameterList.ParameterValueStruct;
            const params = Array.isArray(paramList) ? paramList : [paramList];

            return {
                deviceId: {
                    manufacturer: deviceId.Manufacturer,
                    oui: deviceId.OUI,
                    productClass: deviceId.ProductClass,
                    serialNumber: deviceId.SerialNumber,
                },
                events: events.map((e) => ({
                    eventCode: e.EventCode,
                    commandKey: e.CommandKey,
                })),
                parameters: params.map((param) => ({
                    name: param.Name,
                    value: param.Value ? param.Value._ || param.Value : '',
                    type: param.Value && param.Value['xsi:type'] ? param.Value['xsi:type'] : 'xsd:string',
                })),
                maxEnvelopes: inform.MaxEnvelopes,
                retryCount: inform.RetryCount || 0,
            };
        } catch (error) {
            console.error('Failed to parse Inform:', error);
            throw new Error('Invalid Inform message');
        }
    }

    /**
     * Build empty SOAP response (no more requests)
     */
    buildEmptyResponse() {
        return this.buildEnvelope({});
    }
}

module.exports = new SOAPBuilder();

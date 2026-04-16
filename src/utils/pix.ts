export function generatePixPayload(key: string, name: string, city: string): string {
    const formatLength = (val: string) => val.length.toString().padStart(2, '0');
    
    const idPayloadFormatIndicator = "00";
    const idPointOfInitiationMethod = "01";
    const idMerchantAccountInformation = "26";
    const idMerchantAccountInformationGui = "00";
    const idMerchantAccountInformationKey = "01";
    const idMerchantCategoryCode = "52";
    const idTransactionCurrency = "53";
    const idCountryCode = "58";
    const idMerchantName = "59";
    const idMerchantCity = "60";
    const idAdditionalDataFieldTemplate = "62";
    const idCRC16 = "63";

    const payloadFormatIndicator = `${idPayloadFormatIndicator}0201`;
    const pointOfInitiationMethod = `${idPointOfInitiationMethod}0211`;

    const gui = "br.gov.bcb.pix";
    const merchantAccountInformation = `${idMerchantAccountInformationGui}${formatLength(gui)}${gui}${idMerchantAccountInformationKey}${formatLength(key)}${key}`;
    const merchantAccountInformationFull = `${idMerchantAccountInformation}${formatLength(merchantAccountInformation)}${merchantAccountInformation}`;

    const merchantCategoryCode = `${idMerchantCategoryCode}040000`;
    const transactionCurrency = `${idTransactionCurrency}03986`;
    const countryCode = `${idCountryCode}02BR`;
    
    const formatString = (val: string, max: number) => {
        return val.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z ]/g, "").substring(0, max);
    };
    
    const formattedName = formatString(name, 25) || 'ANJOS DA PAZ';
    const merchantName = `${idMerchantName}${formatLength(formattedName)}${formattedName}`;
    
    const formattedCity = formatString(city, 15) || 'SAO PAULO';
    const merchantCity = `${idMerchantCity}${formatLength(formattedCity)}${formattedCity}`;

    const additionalDataFieldTemplate = `${idAdditionalDataFieldTemplate}070503***`;

    const payload = `${payloadFormatIndicator}${pointOfInitiationMethod}${merchantAccountInformationFull}${merchantCategoryCode}${transactionCurrency}${countryCode}${merchantName}${merchantCity}${additionalDataFieldTemplate}${idCRC16}04`;

    let crc = 0xFFFF;
    for (let i = 0; i < payload.length; i++) {
        crc ^= payload.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) !== 0) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc = crc << 1;
            }
        }
    }
    const crcHex = (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');

    return `${payload}${crcHex}`;
}

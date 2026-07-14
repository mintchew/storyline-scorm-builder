const path = require("path");

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function normalize(relativePath) {
  return relativePath.split(path.sep).join("/");
}

function generateManifest(scorm, files) {
  const fileEntries = files
    .filter((file) => file !== "imsmanifest.xml")
    .sort()
    .map((file) => `      <file href="${escapeXml(normalize(file))}"/>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${escapeXml(scorm.identifier)}"
  version="1.0"
  xmlns="http://www.imsglobal.org/xsd/imscp_v1p1"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_v1p3"
  xmlns:adlseq="http://www.adlnet.org/xsd/adlseq_v1p3"
  xmlns:adlnav="http://www.adlnet.org/xsd/adlnav_v1p3"
  xmlns:imsss="http://www.imsglobal.org/xsd/imsss"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="
    http://www.imsglobal.org/xsd/imscp_v1p1 imscp_v1p1.xsd
    http://www.adlnet.org/xsd/adlcp_v1p3 adlcp_v1p3.xsd
    http://www.adlnet.org/xsd/adlseq_v1p3 adlseq_v1p3.xsd
    http://www.adlnet.org/xsd/adlnav_v1p3 adlnav_v1p3.xsd
    http://www.imsglobal.org/xsd/imsss imsss_v1p0.xsd">

  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>2004 4th Edition</schemaversion>
  </metadata>

  <organizations default="${escapeXml(scorm.organizationIdentifier)}">
    <organization identifier="${escapeXml(scorm.organizationIdentifier)}">
      <title>${escapeXml(scorm.title)}</title>
      <item identifier="ITEM-1" identifierref="${escapeXml(scorm.resourceIdentifier)}">
        <title>${escapeXml(scorm.title)}</title>
      </item>
    </organization>
  </organizations>

  <resources>
    <resource
      identifier="${escapeXml(scorm.resourceIdentifier)}"
      type="webcontent"
      adlcp:scormType="sco"
      href="${escapeXml(scorm.launchFile)}">
${fileEntries}
    </resource>
  </resources>
</manifest>
`;
}

module.exports = { generateManifest };

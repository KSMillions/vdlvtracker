/**
 * VDLV Site Tracker — Contract Forms Configuration
 * 
 * Config-driven contract dropdown data.
 * To add new contracts, simply append to the relevant group array
 * or create a new group object.
 * 
 * Structure:
 *   { group: "Group Label", contracts: [ { value: "unique-key", label: "Display Text" }, ... ] }
 */

const CONTRACT_FORMS = [
  {
    group: "JBCC — Principal Building Agreement (PBA)",
    contracts: [
      { value: "jbcc-pba-6.2", label: "JBCC® PBA (Edition 6.2 — May 2018)" },
      { value: "jbcc-pba-6.1", label: "JBCC® PBA (Edition 6.1 — March 2014)" },
      { value: "jbcc-pba-6.0", label: "JBCC® PBA (Edition 6.0 — September 2013)" },
      { value: "jbcc-pba-5.0", label: "JBCC® PBA (Edition 5.0 Reprint 1 — July 2007)" },
      { value: "jbcc-pba-4.1", label: "JBCC® PBA (Edition 4.1 CODE 2101 — March 2005)" },
      { value: "jbcc-pba-4.0", label: "JBCC® PBA (Edition 4.0 CODE 2108 — August 2007)" }
    ]
  },
  {
    group: "JBCC — N/S Subcontract Agreement",
    contracts: [
      { value: "jbcc-ns-6.2", label: "JBCC® N/S Subcontract (Edition 6.2 — May 2018)" },
      { value: "jbcc-ns-6.1", label: "JBCC® N/S Subcontract (Edition 6.1 — March 2014)" },
      { value: "jbcc-ns-6.0", label: "JBCC® N/S Subcontract (Edition 6.0 — September 2013)" },
      { value: "jbcc-ns-5.0-2101", label: "JBCC® N/S Subcontract (Edition 5 CODE 2101 — July 2007)" },
      { value: "jbcc-ns-5.0", label: "JBCC® N/S Subcontract (Edition 5 — July 2007)" },
      { value: "jbcc-ns-4.1", label: "JBCC® N/S Subcontract (Edition 4.1 — March 2005)" },
      { value: "jbcc-ns-4.0", label: "JBCC® N/S Subcontract (Edition 4 — August 2007)" }
    ]
  },
  {
    group: "JBCC — Domestic Subcontract (MBSA)",
    contracts: [
      { value: "mbsa-dom-2018", label: "MBSA Domestic Subcontractor Agreement (May 2018)" },
      { value: "mbsa-dom-6.1", label: "MBSA Domestic Subcontractor Agreement (Edition 6.1 — March 2014)" },
      { value: "mbsa-dom-2008", label: "MBSA Domestic Subcontractor Agreement (January 2008)" }
    ]
  },
  {
    group: "JBCC — Minor Works Agreement",
    contracts: [
      { value: "jbcc-mw-5.2", label: "JBCC® Minor Works Agreement (Edition 5.2 — May 2018)" },
      { value: "jbcc-mw-5.1-may", label: "JBCC® Minor Works Agreement (Edition 5.1 — May 2014)" },
      { value: "jbcc-mw-5.1-mar", label: "JBCC® Minor Works Agreement (Edition 5.1 — March 2014)" },
      { value: "jbcc-mw-5.0", label: "JBCC® Minor Works Agreement (Edition 5.0 — September 2013)" },
      { value: "jbcc-mw-4.0", label: "JBCC® Minor Works Agreement (Edition 4.0 CODE 2108 — August 2007)" },
      { value: "jbcc-mw-3.0", label: "JBCC® Minor Works Agreement (Edition 3.0 — September 2005)" }
    ]
  },
  {
    group: "JBCC — Direct, Small & Simple, Labour Only",
    contracts: [
      { value: "jbcc-direct-1.0", label: "JBCC® Direct Subcontract Agreement (Edition 1 — May 2020)" },
      { value: "jbcc-small-1.0", label: "JBCC® Small & Simple Subcontract Agreement (Edition 1 — May 2020)" },
      { value: "mbsa-lo-2006", label: "MBSA Labour Only Subcontract Agreement (February 2006)" }
    ]
  },
  {
    group: "FIDIC — International Contracts",
    contracts: [
      { value: "fidic-red-2017", label: "FIDIC Red Book — Conditions of Contract for Construction (2nd Ed. 2017)" },
      { value: "fidic-red-1999", label: "FIDIC Red Book — Conditions of Contract for Construction (1st Ed. 1999)" },
      { value: "fidic-yellow-2017", label: "FIDIC Yellow Book — Conditions of Contract for Plant & Design-Build (2nd Ed. 2017)" },
      { value: "fidic-yellow-1999", label: "FIDIC Yellow Book — Conditions of Contract for Plant & Design-Build (1st Ed. 1999)" },
      { value: "fidic-silver-2017", label: "FIDIC Silver Book — Conditions of Contract for EPC/Turnkey (2nd Ed. 2017)" },
      { value: "fidic-silver-1999", label: "FIDIC Silver Book — Conditions of Contract for EPC/Turnkey (1st Ed. 1999)" },
      { value: "fidic-green-2021", label: "FIDIC Green Book — Short Form of Contract (2nd Ed. 2021)" },
      { value: "fidic-white-2017", label: "FIDIC White Book — Client/Consultant Model Services Agreement (5th Ed. 2017)" }
    ]
  },
  {
    group: "NEC — Engineering & Construction",
    contracts: [
      { value: "nec4-ecc", label: "NEC4 Engineering and Construction Contract (ECC)" },
      { value: "nec4-ecc-short", label: "NEC4 Engineering and Construction Short Contract (ECSC)" },
      { value: "nec4-ecsc-subcontract", label: "NEC4 Engineering and Construction Short Subcontract (ECSS)" },
      { value: "nec4-psc", label: "NEC4 Professional Services Contract (PSC)" },
      { value: "nec4-tsc", label: "NEC4 Term Service Contract (TSC)" },
      { value: "nec4-sc", label: "NEC4 Supply Contract (SC)" },
      { value: "nec3-ecc", label: "NEC3 Engineering and Construction Contract (ECC)" },
      { value: "nec3-ecc-short", label: "NEC3 Engineering and Construction Short Contract (ECSC)" },
      { value: "nec3-psc", label: "NEC3 Professional Services Contract (PSC)" },
      { value: "nec3-tsc", label: "NEC3 Term Service Contract (TSC)" }
    ]
  },
  {
    group: "GCC — General Conditions of Contract (South Africa)",
    contracts: [
      { value: "gcc-2015", label: "GCC 2015 — General Conditions of Contract for Construction Works (3rd Ed.)" },
      { value: "gcc-2010", label: "GCC 2010 — General Conditions of Contract for Construction Works (2nd Ed.)" },
      { value: "gcc-2004", label: "GCC 2004 — General Conditions of Contract for Construction Works (1st Ed.)" }
    ]
  }
];

/**
 * Populate a <select> element with grouped contract options.
 * @param {HTMLSelectElement} selectEl - The <select> element to populate
 * @param {string} [selectedValue] - Optional value to pre-select
 */
function populateContractDropdown(selectEl, selectedValue) {
  // Clear existing
  selectEl.innerHTML = '';

  // Default option
  const defaultOpt = document.createElement('option');
  defaultOpt.value = '';
  defaultOpt.textContent = '— Select Contract Form —';
  selectEl.appendChild(defaultOpt);

  CONTRACT_FORMS.forEach(group => {
    const optgroup = document.createElement('optgroup');
    optgroup.label = group.group;
    group.contracts.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.value;
      opt.textContent = c.label;
      if (selectedValue && c.value === selectedValue) opt.selected = true;
      optgroup.appendChild(opt);
    });
    selectEl.appendChild(optgroup);
  });
}

'use client';

import WorksheetInput from '@/components/worksheet/WorksheetInput';
import StatusDot from '@/components/hub/StatusDot';
import { BASIC_CLIENT_INFO_SECTIONS } from '@/lib/worksheets/basicClientInfoSections';

const ENTITY_TYPE_OPTIONS = [
  { value: '', label: 'Select entity type' },
  { value: 'llc', label: 'LLC' },
  { value: 's-corp', label: 'S Corporation' },
  { value: 'c-corp', label: 'C Corporation' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'sole-proprietorship', label: 'Sole Proprietorship' },
  { value: 'nonprofit', label: 'Nonprofit' },
  { value: 'other', label: 'Other' },
];

/**
 * @param {{
 *   form: Record<string, string>,
 *   onFieldChange: (name: string, value: string) => void,
 *   openSectionIndex: number,
 *   onSectionToggle: (index: number) => void,
 *   sectionStatuses: Record<string, import('@/lib/worksheets/basicClientInfoSections').SectionLifecycleStatus>,
 *   loading?: boolean,
 *   reviewSlot?: import('react').ReactNode,
 * }} props
 */
export default function BasicClientInfoAccordion({
  form,
  onFieldChange,
  openSectionIndex,
  onSectionToggle,
  sectionStatuses,
  loading = false,
  reviewSlot = null,
}) {
  return (
    <div className="bci-accordion">
      {BASIC_CLIENT_INFO_SECTIONS.map((section, index) => {
        const isOpen = openSectionIndex === index;
        const status = sectionStatuses[section.id] || 'not_started';

        return (
          <section
            key={section.id}
            className={`bci-accordion__section${isOpen ? ' bci-accordion__section--open' : ''}`}
          >
            <button
              type="button"
              className="bci-accordion__trigger"
              aria-expanded={isOpen}
              onClick={() => onSectionToggle(index)}
              disabled={loading}
            >
              <div className="bci-accordion__trigger-copy">
                <strong>{section.title}</strong>
                <span>{section.hint}</span>
              </div>
              <StatusDot status={status} />
            </button>

            {isOpen ? (
              <div className="bci-accordion__panel">
                {section.id === 'company-identity' ? (
                  <div className="wizard-fields">
                    <label>
                      Company Name
                      <WorksheetInput
                        type="text"
                        value={form.companyName}
                        onChange={(event) => onFieldChange('companyName', event.target.value)}
                        placeholder="Acme Services LLC"
                        disabled={loading}
                      />
                    </label>
                    <label>
                      Industry
                      <WorksheetInput
                        type="text"
                        value={form.industry}
                        onChange={(event) => onFieldChange('industry', event.target.value)}
                        placeholder="Commercial Services"
                        disabled={loading}
                      />
                    </label>
                    <label>
                      Entity Type
                      <select
                        value={form.entityType}
                        onChange={(event) => onFieldChange('entityType', event.target.value)}
                        disabled={loading}
                      >
                        {ENTITY_TYPE_OPTIONS.map((option) => (
                          <option key={option.value || 'empty'} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      EIN
                      <WorksheetInput
                        type="text"
                        value={form.ein}
                        onChange={(event) => onFieldChange('ein', event.target.value)}
                        placeholder="12-3456789"
                        disabled={loading}
                      />
                    </label>
                  </div>
                ) : null}

                {section.id === 'business-address' ? (
                  <div className="wizard-fields">
                    <label style={{ gridColumn: '1 / -1' }}>
                      Address Line 1
                      <WorksheetInput
                        type="text"
                        value={form.addressLine1}
                        onChange={(event) => onFieldChange('addressLine1', event.target.value)}
                        placeholder="100 Main Street"
                        disabled={loading}
                      />
                    </label>
                    <label style={{ gridColumn: '1 / -1' }}>
                      Address Line 2
                      <WorksheetInput
                        type="text"
                        value={form.addressLine2}
                        onChange={(event) => onFieldChange('addressLine2', event.target.value)}
                        placeholder="Suite 200"
                        disabled={loading}
                      />
                    </label>
                    <label>
                      City
                      <WorksheetInput
                        type="text"
                        value={form.locationCity}
                        onChange={(event) => onFieldChange('locationCity', event.target.value)}
                        placeholder="Chicago"
                        disabled={loading}
                      />
                    </label>
                    <label>
                      State
                      <WorksheetInput
                        type="text"
                        value={form.locationState}
                        onChange={(event) => onFieldChange('locationState', event.target.value)}
                        placeholder="IL"
                        disabled={loading}
                      />
                    </label>
                    <label>
                      Postal Code
                      <WorksheetInput
                        type="text"
                        value={form.addressPostalCode}
                        onChange={(event) => onFieldChange('addressPostalCode', event.target.value)}
                        placeholder="60601"
                        disabled={loading}
                      />
                    </label>
                  </div>
                ) : null}

                {section.id === 'primary-contact' ? (
                  <div className="wizard-fields">
                    <label>
                      Primary Contact Name
                      <WorksheetInput
                        type="text"
                        value={form.primaryContactName}
                        onChange={(event) => onFieldChange('primaryContactName', event.target.value)}
                        placeholder="Jane Doe"
                        disabled={loading}
                      />
                    </label>
                    <label>
                      Primary Contact Email
                      <WorksheetInput
                        type="email"
                        value={form.primaryContactEmail}
                        onChange={(event) => onFieldChange('primaryContactEmail', event.target.value)}
                        placeholder="jane@acme.com"
                        disabled={loading}
                      />
                    </label>
                    <label>
                      Primary Contact Phone
                      <WorksheetInput
                        type="text"
                        value={form.primaryContactPhone}
                        onChange={(event) => onFieldChange('primaryContactPhone', event.target.value)}
                        placeholder="(312) 555-0100"
                        disabled={loading}
                      />
                    </label>
                  </div>
                ) : null}

                {section.id === 'ownership' ? (
                  <div className="wizard-fields">
                    <label>
                      Owner / Principal Name
                      <WorksheetInput
                        type="text"
                        value={form.ownerName}
                        onChange={(event) => onFieldChange('ownerName', event.target.value)}
                        disabled={loading}
                      />
                    </label>
                    <label>
                      Title
                      <WorksheetInput
                        type="text"
                        value={form.ownerTitle}
                        onChange={(event) => onFieldChange('ownerTitle', event.target.value)}
                        disabled={loading}
                      />
                    </label>
                    <label style={{ gridColumn: '1 / -1' }}>
                      Ownership Notes
                      <textarea
                        value={form.ownershipNotes}
                        onChange={(event) => onFieldChange('ownershipNotes', event.target.value)}
                        disabled={loading}
                      />
                    </label>
                  </div>
                ) : null}

                {section.id === 'professional-partners' ? (
                  <div className="bci-accordion__partner-grid">
                    <fieldset className="bci-accordion__partner-card">
                      <legend>CPA</legend>
                      <label>
                        Name
                        <WorksheetInput type="text" value={form.cpaName} onChange={(e) => onFieldChange('cpaName', e.target.value)} disabled={loading} />
                      </label>
                      <label>
                        Firm
                        <WorksheetInput type="text" value={form.cpaFirm} onChange={(e) => onFieldChange('cpaFirm', e.target.value)} disabled={loading} />
                      </label>
                      <label>
                        Email
                        <WorksheetInput type="email" value={form.cpaEmail} onChange={(e) => onFieldChange('cpaEmail', e.target.value)} disabled={loading} />
                      </label>
                      <label>
                        Phone
                        <WorksheetInput type="text" value={form.cpaPhone} onChange={(e) => onFieldChange('cpaPhone', e.target.value)} disabled={loading} />
                      </label>
                    </fieldset>
                    <fieldset className="bci-accordion__partner-card">
                      <legend>Attorney</legend>
                      <label>
                        Name
                        <WorksheetInput type="text" value={form.attorneyName} onChange={(e) => onFieldChange('attorneyName', e.target.value)} disabled={loading} />
                      </label>
                      <label>
                        Firm
                        <WorksheetInput type="text" value={form.attorneyFirm} onChange={(e) => onFieldChange('attorneyFirm', e.target.value)} disabled={loading} />
                      </label>
                      <label>
                        Email
                        <WorksheetInput type="email" value={form.attorneyEmail} onChange={(e) => onFieldChange('attorneyEmail', e.target.value)} disabled={loading} />
                      </label>
                      <label>
                        Phone
                        <WorksheetInput type="text" value={form.attorneyPhone} onChange={(e) => onFieldChange('attorneyPhone', e.target.value)} disabled={loading} />
                      </label>
                    </fieldset>
                    <fieldset className="bci-accordion__partner-card">
                      <legend>Banker</legend>
                      <label>
                        Name
                        <WorksheetInput type="text" value={form.bankerName} onChange={(e) => onFieldChange('bankerName', e.target.value)} disabled={loading} />
                      </label>
                      <label>
                        Institution
                        <WorksheetInput type="text" value={form.bankerInstitution} onChange={(e) => onFieldChange('bankerInstitution', e.target.value)} disabled={loading} />
                      </label>
                      <label>
                        Email
                        <WorksheetInput type="email" value={form.bankerEmail} onChange={(e) => onFieldChange('bankerEmail', e.target.value)} disabled={loading} />
                      </label>
                      <label>
                        Phone
                        <WorksheetInput type="text" value={form.bankerPhone} onChange={(e) => onFieldChange('bankerPhone', e.target.value)} disabled={loading} />
                      </label>
                    </fieldset>
                  </div>
                ) : null}

                {section.id === 'engagement-notes' ? (
                  <label className="bci-accordion__notes">
                    Engagement Notes
                    <textarea
                      value={form.notes}
                      onChange={(event) => onFieldChange('notes', event.target.value)}
                      placeholder="Optional context for consultant prep."
                      disabled={loading}
                    />
                  </label>
                ) : null}

                {section.id === 'review' ? reviewSlot : null}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

import React from 'react';

const ServiceSelector = ({ value, onChange, disabled = false }) => {
  const services = [
    { id: 'tire_change', name: 'Tire Change', icon: '🔧', price: 'KES 1,500 - 2,500', description: 'Replace flat tire with your spare' },
    { id: 'jump_start', name: 'Jump Start', icon: '🔋', price: 'KES 1,000 - 1,800', description: 'Dead battery jump-start service' },
    { id: 'fuel_delivery', name: 'Fuel Delivery', icon: '⛽', price: 'KES 1,200 - 2,000', description: 'Emergency fuel delivery' },
    { id: 'towing_5km', name: 'Towing (up to 5km)', icon: '🚚', price: 'KES 2,500 - 4,000', description: 'Tow your vehicle to nearest garage' },
    { id: 'custom', name: 'Custom Service', icon: '🔧', price: 'Will be quoted', description: 'Special request or complex repair' },
  ];

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Service Needed *
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="input-primary"
      >
        {services.map((service) => (
          <option key={service.id} value={service.id}>
            {service.icon} {service.name} - {service.price}
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-500">
        {services.find(s => s.id === value)?.description}
      </p>
    </div>
  );
};

export default ServiceSelector;
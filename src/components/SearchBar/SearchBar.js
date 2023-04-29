import React from 'react';
import Select, { createFilter } from 'react-select';
import './SearchBar.css';

const brandColor = '#59A127';
const customStyles = {
  control: (base, state) => ({
    ...base,
    borderColor: state.isFocused ? brandColor : base.borderColor,
    boxShadow: state.isFocused ? null : null,
    '&:hover': {
      borderColor: state.isFocused ? brandColor : base.borderColor
    }
  })
};

const SearchBar = props => (
  <div className="SearchBar">
    <Select
      onChange={selectedStation => props.onChange(selectedStation)}
      options={props.options}
      placeholder={props.placeholder}
      noOptionsMessage={props.noOptionsMessage}
      filterOption={createFilter({
        ignoreCase: true,
        ignoreAccents: false,
        matchFrom: 'start'
      })}
      styles={customStyles}
    />
  </div>
);

export default SearchBar;

-- Display people and their phone numbers
SELECT CONCAT(first_name, ' ',last_name) AS name, 
CONCAT('(',area_code,')', ' ',phone_number) AS phone
FROM people;

-- Display people and their addresses
SELECT CONCAT(first_name,' ', last_name) AS name, 
a.street_num, a.street_prefix, a.street_name, a.street_suffix, a.unit_number, a.city, a.state, a.zip
FROM people p
LEFT JOIN people_to_address_mappings ptam ON ptam.person_id = p.person_id
JOIN addresses a ON a.address_id = ptam.address_id;

-- Display people and their addresses only if they are in the state of California
SELECT CONCAT(first_name,' ', last_name) AS name, 
a.street_num, a.street_prefix, a.street_name, a.street_suffix, a.unit_number, a.city, a.state, a.zip
FROM people p
LEFT JOIN people_to_address_mappings ptam ON ptam.person_id = p.person_id
JOIN addresses a ON a.address_id = ptam.address_id
WHERE a.state LIKE 'CA';

-- Show how many people have addresses in each state
SELECT COUNT(t.id) as num_people, t.state as state
FROM 
(SELECT p.person_id as id, a.state as state FROM people p
LEFT JOIN people_to_address_mappings ptam ON ptam.person_id = p.person_id
JOIN addresses a ON a.address_id = ptam.address_id) t
GROUP BY t.state;

-- Show the % of people that have multiple addresses
SELECT t2.address_count/t1.total_count AS percentage
FROM 
(SELECT COUNT(person_id) AS total_count
FROM people p) t1
CROSS JOIN
(SELECT count(address_id) as address_count
FROM people_to_address_mappings 
GROUP BY person_id 
HAVING address_count >1) t2;

---------------------------------------------------------

CREATE TABLE people (
  person_id int(11) NOT NULL AUTO_INCREMENT,
  first_name varchar(25),
  middle_name varchar(25),
  last_name varchar(25), 
  area_code int(3), 
  phone_number int(7), 
  PRIMARY KEY (person_id)
) DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;

CREATE TABLE addresses (
  address_id int(11) NOT NULL AUTO_INCREMENT,
  street_num int(10),
  street_prefix varchar(20),
  street_name varchar(50),
  street_suffix varchar(20),
  unit_number varchar(10),
  city varchar(25),
  state varchar(2),
  zip varchar(5),
  PRIMARY KEY (address_id)
) DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;

CREATE TABLE people_to_address_mappings (
  person_id int(11),
  address_id int(11),
  PRIMARY KEY (person_id, address_id),
  UNIQUE INDEX (person_id, address_id),
  foreign key (person_id) references people(person_id),
  foreign key (address_id) references addresses(address_id)
);
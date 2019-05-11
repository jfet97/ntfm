// class decorator factory to check static side against a constructor interface
export function staticImplements<WANTED_CONSTRUCTOR_TYPE>() {
    return (
        <CHECKED_CONSTRUCTOR_TYPE extends WANTED_CONSTRUCTOR_TYPE>(constructor: CHECKED_CONSTRUCTOR_TYPE): CHECKED_CONSTRUCTOR_TYPE => constructor
    );
}